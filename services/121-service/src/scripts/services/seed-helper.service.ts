import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import FormData from 'form-data';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { DataSource, DeepPartial, Equal, In } from 'typeorm';

import { getBaseUrl, IS_DEVELOPMENT } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { stringIsFsp } from '@121-service/src/fsp-management/fsp-settings.helpers';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { ExcelFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/excel/repositories/excel-fsp-configuration.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramFspConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';
import { RegistrationProgramIdSequenceRepository } from '@121-service/src/programs/repositories/registration-program-id-sequence.repository';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

type ProgramRegistrationAttributeSeed = DeepPartial<ProgramRegistrationAttributeEntity> & {
  name: string;
  answerType?: RegistrationAttributeTypes;
  options: { option: string }[];
  scoring: Record<string, unknown>;
};

interface ProgramFspConfigurationSeed {
  fsp: string;
  properties?: { name: string; value: string }[];
  uniqueIdentifierField?: string;
  exportFields?: string[];
  name?: string;
  label: UILanguageTranslation;
}

interface ValidatedProgramFspConfigurationSeed
  extends Omit<ProgramFspConfigurationSeed, 'fsp'> {
  fsp: Fsps;
}

@Injectable()
export class SeedHelperService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly excelFspConfigurationRepository: ExcelFspConfigurationRepository,
    private readonly programFspConfigurationsService: ProgramFspConfigurationsService,
    private readonly httpService: CustomHttpService,
    private readonly axiosCallsService: AxiosCallsService,
    private readonly programApprovalThresholdsService: ProgramApprovalThresholdsService,
    private readonly registrationProgramIdSequenceRepository: RegistrationProgramIdSequenceRepository,
  ) {}

  public async seedData({
    seedConfig,
    isApiTests = false,
    approverMode,
  }: {
    seedConfig: SeedConfigurationDto;
    isApiTests?: boolean;
    approverMode: ApproverSeedMode;
  }) {
    // ***** SET SEQUENCE *****
    // This is to keep PV and OCW program ids on respectively 2 and 3
    // This to prevent differences between our local- and production database so we are less prone to mistakes
    if (seedConfig.firstProgramId && seedConfig.firstProgramId !== 1) {
      await this.dataSource.query(
        `ALTER SEQUENCE "121-service".program_id_seq RESTART WITH ${seedConfig.firstProgramId};`,
      );
    }

    for (const program of seedConfig.programs) {
      // Add program
      const programPath = `program/${program.program}`;
      const programData = await this.importData(programPath);
      const programEntity = await this.addProgram(programData);

      await this.addMessageTemplate(program.messageTemplate, programEntity);

      // Add default users
      const debugScopes = Object.values(DebugScope);
      await this.addDefaultUsers({
        program: programEntity,
        debugScopeUsers: seedConfig.includeDebugScopes ? debugScopes : [],
        approverMode,
      });

      // Add registrations if provided this is only for demo purposes
      if (program.registrations) {
        await this.importRegistrations({
          programId: programEntity.id,
          registrationsFile: program.registrations,
          isTest: isApiTests,
        });
      }
    }
  }

  private async importRegistrations({
    programId,
    registrationsFile,
    isTest,
  }: {
    programId: number;
    registrationsFile: string;
    isTest: boolean;
  }) {
    const registrationsSubPath = `registrations/${registrationsFile}`;
    const registrationsFullPath = this.getSeedDataPath(registrationsSubPath);

    let filePathToUpload = registrationsFullPath;
    // Handle test mode: trim to first 5 lines
    // This is to speed up tests and avoid large file uploads
    if (isTest) {
      filePathToUpload = await this.getLimitedCsvFile(registrationsFullPath);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(filePathToUpload));

    const accessToken = await this.axiosCallsService.getAccessToken();
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);
    const formHeaders = form.getHeaders();
    for (const key in formHeaders) {
      if (Object.hasOwn(formHeaders, key)) {
        headers.append(key, formHeaders[key]);
      }
    }

    const url = `${getBaseUrl()}/programs/${programId}/registrations/import`;
    await this.httpService.post(url, form, headers);
  }

  private async getLimitedCsvFile(sourcePath: string): Promise<string> {
    const limit = 5;
    const tempFilePath = path.join(
      os.tmpdir(),
      `test-${Date.now()}-${path.basename(sourcePath)}`,
    );
    const input = fs.createReadStream(sourcePath);
    const output = fs.createWriteStream(tempFilePath);
    const rl = readline.createInterface({ input });

    let lineCount = 0;
    for await (const line of rl) {
      output.write(line + '\n');
      lineCount++;
      if (lineCount >= limit) break;
    }
    output.end();
    return tempFilePath;
  }

  private importData(subPath: string) {
    const filePath = this.getSeedDataPath(subPath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  private getSeedDataPath(subPath: string): string {
    return path.join(__dirname, '../../seed-data', subPath);
  }

  public async addDefaultUsers({
    program,
    debugScopeUsers,
    approverMode,
  }: {
    program: ProgramEntity;
    debugScopeUsers: string[];
    approverMode: ApproverSeedMode;
  }): Promise<void> {
    const users = [
      {
        type: 'programAdminUser',
        username: env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN,
        roles: [DefaultUserRole.ProgramAdmin],
      },
      {
        type: 'viewOnlyUser',
        username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
        roles: [DefaultUserRole.View],
      },
      {
        type: 'koboRegistrationUser',
        username: env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_REGISTRATION,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO_REGISTRATION,
        roles: [DefaultUserRole.KoboRegistrationUser],
      },
      {
        type: 'koboValidationUser',
        username: env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_VALIDATION,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO_VALIDATION,
        roles: [DefaultUserRole.KoboValidationUser],
      },
      {
        type: 'cvaManager',
        username: env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
        roles: [DefaultUserRole.CvaManager],
      },
      {
        type: 'cvaOfficer',
        username: env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER,
        roles: [DefaultUserRole.CvaOfficer],
      },
      {
        type: 'financeManager',
        username: env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_MANAGER,
        roles: [DefaultUserRole.FinanceManager],
      },
      {
        type: 'financeOfficer',
        username: env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_OFFICER,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_OFFICER,
        roles: [DefaultUserRole.FinanceOfficer],
      },
      {
        type: 'ViewWithoutPII',
        username: env.USERCONFIG_121_SERVICE_EMAIL_VIEW_WITHOUT_PII,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_VIEW_WITHOUT_PII,
        roles: [DefaultUserRole.ViewWithoutPII],
      },
    ];
    if (approverMode === ApproverSeedMode.demo) {
      users.push({
        type: 'approver',
        username: env.USERCONFIG_121_SERVICE_EMAIL_APPROVER,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_APPROVER,
        roles: [DefaultUserRole.Approver],
      });
    }

    for (const user of users) {
      const savedUser = await this.getOrSaveUser(user);
      if (savedUser) {
        await this.assignAidworker(savedUser.id, program.id, user.roles);
      }
    }

    if (debugScopeUsers && IS_DEVELOPMENT) {
      for (const debugScopeUser of debugScopeUsers) {
        const scopedUser = await this.getOrSaveUser({
          type: 'debugScopedUser',
          username: `${debugScopeUser}@example.org`,
          password: env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
        });
        if (scopedUser) {
          await this.assignAidworker(
            scopedUser.id,
            program.id,
            [DefaultUserRole.CvaManager],
            debugScopeUser,
          );
        }
      }
    }

    await this.assignAdminUserToProgram({
      programId: program.id,
    });

    await this.configureApproversForProgram({
      programId: program.id,
      approverMode,
    });
  }

  private async configureApproversForProgram({
    programId,
    approverMode,
  }: {
    programId: number;
    approverMode: ApproverSeedMode;
  }): Promise<void> {
    if (approverMode === ApproverSeedMode.none) {
      return;
    }

    const userRepository = this.dataSource.getRepository(UserEntity);

    const adminUser = await userRepository.findOneOrFail({
      where: { username: Equal(env.USERCONFIG_121_SERVICE_EMAIL_ADMIN) },
    });

    const thresholds: CreateProgramApprovalThresholdDto[] = [];

    switch (approverMode) {
      case ApproverSeedMode.admin:
        thresholds.push({
          thresholdAmount: 0,

          userIds: [adminUser.id],
        });
        break;
      case ApproverSeedMode.demo: {
        const approverUser = await userRepository.findOneOrFail({
          where: {
            username: Equal(env.USERCONFIG_121_SERVICE_EMAIL_APPROVER!),
          },
        });
        const financeManagerUser = await userRepository.findOneOrFail({
          where: {
            username: Equal(env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER!),
          },
        });
        const cvaManagerUser = await userRepository.findOneOrFail({
          where: {
            username: Equal(env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER!),
          },
        });

        thresholds.push(
          {
            thresholdAmount: 0,
            userIds: [approverUser.id],
          },
          {
            thresholdAmount: 100,
            userIds: [financeManagerUser.id, cvaManagerUser.id],
          },
        );
        break;
      }
    }

    await this.programApprovalThresholdsService.createOrReplaceProgramApprovalThresholds(
      {
        programId,
        thresholds,
        // we are using userId 0 for seeding, because the userId is not relevant in this context as this happens for none production seed scenario's only
        // This is to prevent issues with self-assignment when the approver includes the main admin user, because the main admin user is also used to assign the approval threshold to the program
        currentUserId: 0,
      },
    );
  }

  public async getOrSaveUser(userInput: {
    type: string;
    username?: string;
    password?: string;
  }): Promise<UserEntity | undefined> {
    if (!userInput.username || !userInput.password) {
      console.log(
        `User "${userInput.type}" not created, because username or password not set in environment`,
      );
      return;
    }
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({
      where: { username: Equal(userInput.username) },
    });
    if (user) {
      return user;
    } else {
      return await userRepository.save({
        username: userInput.username,
        password: crypto.createHmac('sha256', userInput.password).digest('hex'),
        userType: UserType.aidWorker,
        displayName: userInput.username.split('@')[0],
      });
    }
  }

  public async addProgram(programExample: any): Promise<ProgramEntity> {
    const programRepository = this.dataSource.getRepository(ProgramEntity);
    const programExampleDump = JSON.stringify(programExample);
    const programFromJSON = JSON.parse(programExampleDump);
    const programReturn = await programRepository.save(programFromJSON);

    await this.registrationProgramIdSequenceRepository.createForProgram({
      programId: programReturn.id,
    });

    const programRegistrationAttributes =
      programFromJSON.programRegistrationAttributes;
    programFromJSON.programRegistrationAttibutes = [];
    await this.saveProgramRegistrationAttributes({
      programId: programReturn.id,
      attributes: programRegistrationAttributes,
    });

    const foundProgram = await programRepository.findOneOrFail({
      where: { id: Equal(programReturn.id) },
    });
    const programAttributeNames = (
      await this.getProgramRegistrationAttributeNames({
        programId: foundProgram.id,
      })
    ).map(({ name }) => name);
    foundProgram.programFspConfigurations = [];

    await this.saveProgramFspConfigurations({
      program: foundProgram,
      configurations: programFromJSON.programFspConfigurations,
      programAttributeNames,
    });

    return programRepository.findOneByOrFail({ id: Equal(foundProgram.id) });
  }

  private async saveProgramRegistrationAttributes({
    programId,
    attributes,
  }: {
    programId: number;
    attributes: ProgramRegistrationAttributeSeed[];
  }): Promise<void> {
    const programRegistrationAttributeRepository = this.dataSource.getRepository(
      ProgramRegistrationAttributeEntity,
    );

    for (const attribute of attributes) {
      attribute.isRequired = attribute.isRequired || false;
      this.validateDropdownAttributeScoring({ attribute });
      attribute.programId = programId;
      await programRegistrationAttributeRepository.save(attribute);
    }
  }

  private validateDropdownAttributeScoring({
    attribute,
  }: {
    attribute: {
      name: string;
      answerType?: RegistrationAttributeTypes;
      options: { option: string }[];
      scoring: Record<string, unknown>;
    };
  }): void {
    if (attribute.answerType !== RegistrationAttributeTypes.dropdown) {
      return;
    }

    const scoringKeys = Object.keys(attribute.scoring);
    if (scoringKeys.length === 0) {
      return;
    }

    const optionKeys = attribute.options.map(({ option }) => option);
    const areOptionScoringEqual =
      JSON.stringify(scoringKeys.toSorted((a, b) => a.localeCompare(b))) ===
      JSON.stringify(optionKeys.toSorted((a, b) => a.localeCompare(b)));
    if (!areOptionScoringEqual) {
      throw new HttpException(
        `Option and scoring is not equal of question ${attribute.name}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private async getProgramRegistrationAttributeNames({
    programId,
  }: {
    programId: number;
  }): Promise<{ name: string }[]> {
    const programRegistrationAttributeRepository = this.dataSource.getRepository(
      ProgramRegistrationAttributeEntity,
    );

    return programRegistrationAttributeRepository.find({
      where: { programId: Equal(programId) },
      select: { name: true },
    });
  }

  private async saveProgramFspConfigurations({
    program,
    configurations,
    programAttributeNames,
  }: {
    program: ProgramEntity;
    configurations: ProgramFspConfigurationSeed[];
    programAttributeNames: string[];
  }): Promise<void> {
    for (const configuration of configurations) {
      const fspName = configuration.fsp;
      if (!stringIsFsp(fspName)) {
        throw new HttpException(
          `FSP with name ${fspName} not found in FSP_SETTINGS`,
          HttpStatus.NOT_FOUND,
        );
      }

      const validatedConfiguration = { ...configuration, fsp: fspName };
      const fspSettings = FSP_SETTINGS[fspName];
      const programFspConfiguration = this.createProgramFspConfiguration(
        validatedConfiguration,
        fspSettings,
        program.id,
      );
      const savedConfiguration =
        await this.programFspConfigurationRepository.save(
          programFspConfiguration,
        );

      await this.saveExcelFspConfiguration({
        configuration: validatedConfiguration,
        savedProgramFspConfiguration: savedConfiguration,
        programAttributeNames,
      });
    }
  }

  private async saveExcelFspConfiguration({
    configuration,
    savedProgramFspConfiguration,
    programAttributeNames,
  }: {
    configuration: ProgramFspConfigurationSeed;
    savedProgramFspConfiguration: ProgramFspConfigurationEntity;
    programAttributeNames: string[];
  }): Promise<void> {
    if (
      configuration.fsp !== Fsps.excel ||
      !configuration.uniqueIdentifierField
    ) {
      return;
    }

    const exportFields = configuration.exportFields ?? programAttributeNames;
    const invalidFields = [
      configuration.uniqueIdentifierField,
      ...exportFields,
    ].filter((field) => !programAttributeNames.includes(field));
    if (invalidFields.length > 0) {
      throw new HttpException(
        `Excel seed configuration contains unknown registration attributes: ${[...new Set(invalidFields)].join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.excelFspConfigurationRepository.saveConfiguration({
      programFspConfigurationId: savedProgramFspConfiguration.id,
      uniqueIdentifierField: configuration.uniqueIdentifierField,
      exportFields,
    });
    await this.programFspConfigurationsService.synchronizeFspConfigurationState(
      {
        programFspConfigurationId: savedProgramFspConfiguration.id,
        fspName: Fsps.excel,
      },
    );
  }

  private createProgramFspConfiguration(
    fspConfigFromJson: ValidatedProgramFspConfigurationSeed,
    fspObject: FspSettingsDto,
    programId: number,
  ): ProgramFspConfigurationEntity {
    const fspConfigEntity = new ProgramFspConfigurationEntity();
    fspConfigEntity.fspName = fspConfigFromJson.fsp;
    fspConfigEntity.properties =
      fspConfigFromJson.fsp === Fsps.excel
        ? []
        : this.createProgramFspConfigurationProperties(
            fspConfigFromJson.properties ?? [],
          );
    fspConfigEntity.label = fspConfigFromJson.label
      ? fspConfigFromJson.label
      : fspObject.defaultLabel;
    fspConfigEntity.name = fspConfigFromJson.name
      ? fspConfigFromJson.name
      : fspObject.name;
    fspConfigEntity.transactionEvents = [];
    fspConfigEntity.programId = programId;
    fspConfigEntity.state =
      fspConfigFromJson.fsp === Fsps.excel
        ? this.programFspConfigurationsService.getInitialFspConfigurationState({
            fspName: fspConfigFromJson.fsp,
            fspConfigurationProperties: [],
          })
        : FspConfigurationStates.configured;
    return fspConfigEntity;
  }

  private createProgramFspConfigurationProperties(
    propertiesFromJSON: { name: string; value: string }[],
  ): ProgramFspConfigurationPropertyEntity[] {
    const fspConfigPropertyEntities: ProgramFspConfigurationPropertyEntity[] =
      [];

    for (const property of propertiesFromJSON) {
      let fspConfigPropertyValue = property.value;
      if (typeof property.value === 'string') {
        // eslint-disable-next-line n/no-process-env -- Not all FSP-Config-properties are known in code, so we need to check with the runtime environment
        fspConfigPropertyValue = process.env[property.value] || property.value;
      }
      const fspConfigPropertyEntity =
        new ProgramFspConfigurationPropertyEntity();
      fspConfigPropertyEntity.name =
        property.name as FspConfigurationProperties;
      fspConfigPropertyEntity.value = fspConfigPropertyValue;
      fspConfigPropertyEntities.push(fspConfigPropertyEntity);
    }
    return fspConfigPropertyEntities;
  }

  public async assignAidworker(
    userId: number,
    programId: number,
    roles: DefaultUserRole[] | string[],
    scope?: string,
  ): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const programRepository = this.dataSource.getRepository(ProgramEntity);
    const userRoleRepository = this.dataSource.getRepository(UserRoleEntity);
    const assignmentRepository = this.dataSource.getRepository(
      ProgramAidworkerAssignmentEntity,
    );
    const user = await userRepository.findOneBy({
      id: userId,
    });
    await assignmentRepository.save({
      scope,
      user,
      program: await programRepository.findOne({
        where: {
          id: Equal(programId),
        },
      }),
      roles: await userRoleRepository.find({
        where: {
          role: In(roles),
        },
      }),
    } as DeepPartial<ProgramAidworkerAssignmentEntity>);
  }

  public async assignAdminUserToProgram({
    programId,
  }: {
    programId: number;
  }): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const adminUser = await userRepository.findOneOrFail({
      where: {
        username: Equal(env.USERCONFIG_121_SERVICE_EMAIL_ADMIN),
      },
    });
    await this.assignAidworker(adminUser.id, programId, [
      DefaultUserRole.Admin,
    ]);
  }

  public async addMessageTemplate(
    messageTemplate: SeedMessageTemplateConfig,
    program: ProgramEntity,
  ): Promise<void> {
    const messageTemplateRepo = this.dataSource.getRepository(
      MessageTemplateEntity,
    );
    for (const messageType of Object.keys(messageTemplate)) {
      const messageObject = messageTemplate[messageType].message;
      const contentSidObject = messageTemplate[messageType].contentSid;

      const messageLanguages = messageObject ? Object.keys(messageObject) : [];
      const contentSidLanguages = contentSidObject
        ? Object.keys(contentSidObject)
        : [];
      const languages = [
        ...new Set([...messageLanguages, ...contentSidLanguages]),
      ];

      for (const language of languages) {
        const template = await this.createMessageTemplate(
          program,
          messageType,
          language,
          messageObject?.[language],
          contentSidObject?.[language],
          messageTemplate[messageType].isSendMessageTemplate,
          messageTemplate[messageType]?.label?.[language] ?? null,
        );

        await messageTemplateRepo.save(template);
      }
    }
  }

  public async createMessageTemplate(
    program: ProgramEntity,
    type: string,
    language: string,
    message: string,
    contentSid: string,
    isSendMessageTemplate: boolean,
    label: UILanguageTranslation,
  ): Promise<MessageTemplateEntity> {
    const messageTemplateEntity = new MessageTemplateEntity();
    messageTemplateEntity.program = program;
    messageTemplateEntity.type = type;
    messageTemplateEntity.label = label ? structuredClone(label) : null;
    messageTemplateEntity.language = language;
    messageTemplateEntity.message = message;
    messageTemplateEntity.contentSid = contentSid;
    messageTemplateEntity.isSendMessageTemplate = isSendMessageTemplate;

    if (messageTemplateEntity.message) {
      await this.messageTemplateService.validatePlaceholders(
        program.id,
        messageTemplateEntity.message,
      );
    }

    return messageTemplateEntity;
  }
}
