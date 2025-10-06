import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import FormData from 'form-data';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { join } from 'path';
import * as readline from 'readline';
import { DataSource, DeepPartial, Equal, In } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsps/fsp.dto';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

@Injectable()
export class SeedHelperService {
  public constructor(
    private dataSource: DataSource,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly httpService: CustomHttpService,
    private readonly axiosCallsService: AxiosCallsService,
  ) {}

  public async seedData(seedConfig: SeedConfigurationDto, isApiTests = false) {
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
      const programEntity = await this.addProgram(programData, isApiTests);

      // Add message templates
      await this.addMessageTemplates(program.messageTemplate, programEntity);

      // Add default users
      const debugScopes = Object.values(DebugScope);
      await this.addDefaultUsers(
        programEntity,
        seedConfig.includeDebugScopes ? debugScopes : [],
      );

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
      if (Object.prototype.hasOwnProperty.call(formHeaders, key)) {
        headers.push({
          name: key,
          value: formHeaders[key],
        });
      }
    }

    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/registrations/import`;
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
    return join(__dirname, '../../seed-data', subPath);
  }

  public async addDefaultUsers(
    program: ProgramEntity,
    debugScopeUsers: string[] = [],
  ): Promise<void> {
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
          password: env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN,
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

    await this.assignAdminUserToProgram(program.id);
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

  public async addProgram(
    programExample: any,
    isApiTests: boolean,
  ): Promise<ProgramEntity> {
    const programRepository = this.dataSource.getRepository(ProgramEntity);

    const programRegistrationAttributeRepo = this.dataSource.getRepository(
      ProgramRegistrationAttributeEntity,
    );

    const programExampleDump = JSON.stringify(programExample);
    const programFromJSON = JSON.parse(programExampleDump);

    if (IS_DEVELOPMENT && !isApiTests) {
      programFromJSON.published = true;
    }

    const programReturn = await programRepository.save(programFromJSON);

    // Remove original program registration attributes and add it to a separate variable
    const programRegistrationAttributes =
      programFromJSON.programRegistrationAttributes;
    programFromJSON.programRegistrationAttibutes = [];
    for (const attribute of programRegistrationAttributes) {
      attribute.isRequired = attribute.isRequired || false;
      if (attribute.answerType === RegistrationAttributeTypes.dropdown) {
        const scoringKeys = Object.keys(attribute.scoring);
        if (scoringKeys.length > 0) {
          const optionKeys = attribute.options.map(({ option }) => option);
          const areOptionScoringEqual =
            JSON.stringify(scoringKeys.sort()) ==
            JSON.stringify(optionKeys.sort());
          if (!areOptionScoringEqual) {
            throw new HttpException(
              'Option and scoring is not equal of question  ' + attribute.name,
              404,
            );
          }
        }
      }
      attribute.programId = programReturn.id;
      await programRegistrationAttributeRepo.save(attribute);
    }

    const foundProgram = await programRepository.findOneOrFail({
      where: { id: Equal(programReturn.id) },
    });
    const fspConfigArrayFromJson = programFromJSON.programFspConfigurations;
    foundProgram.programFspConfigurations = [];

    for (const fspConfigFromJson of fspConfigArrayFromJson) {
      const fspObject = FSP_SETTINGS.find(
        (fsp) => fsp.name === fspConfigFromJson.fsp,
      );
      if (!fspObject) {
        throw new HttpException(
          `FSP with name ${fspConfigFromJson.fsp} not found in FSP_SETTINGS`,
          HttpStatus.NOT_FOUND,
        );
      }

      const programFspConfig = this.createProgramFspConfiguration(
        fspConfigFromJson,
        fspObject,
        foundProgram.id,
      );
      await this.programFspConfigurationRepository.save(programFspConfig);
    }

    return programRepository.findOneByOrFail({ id: Equal(foundProgram.id) });
  }

  private createProgramFspConfiguration(
    fspConfigFromJson: {
      fsp: Fsps;
      properties: { name: string; value: string }[] | undefined;
      name?: string;
      label: LocalizedString;
    },
    fspObject: FspDto,
    programId: number,
  ): ProgramFspConfigurationEntity {
    const fspConfigEntity = new ProgramFspConfigurationEntity();
    fspConfigEntity.fspName = fspConfigFromJson.fsp;
    fspConfigEntity.properties = this.createProgramFspConfigurationProperties(
      fspConfigFromJson.properties ?? [],
    );
    fspConfigEntity.label = fspConfigFromJson.label
      ? fspConfigFromJson.label
      : fspObject.defaultLabel;
    fspConfigEntity.name = fspConfigFromJson.name
      ? fspConfigFromJson.name
      : fspObject.name;
    fspConfigEntity.transactions = [];
    fspConfigEntity.programId = programId;
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

  public async assignAdminUserToProgram(programId: number): Promise<void> {
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

  public async addMessageTemplates(
    messageTemplates: SeedMessageTemplateConfig,
    program: ProgramEntity,
  ): Promise<void> {
    const messageTemplateRepo = this.dataSource.getRepository(
      MessageTemplateEntity,
    );
    for (const messageType of Object.keys(messageTemplates)) {
      const messageObject = messageTemplates[messageType].message;
      const contentSidObject = messageTemplates[messageType].contentSid;

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
          messageTemplates[messageType].isSendMessageTemplate,
          messageTemplates[messageType]?.label?.[language] ?? null,
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
    label: LocalizedString,
  ): Promise<MessageTemplateEntity> {
    const messageTemplateEntity = new MessageTemplateEntity();
    messageTemplateEntity.program = program;
    messageTemplateEntity.type = type;
    messageTemplateEntity.label = label
      ? JSON.parse(JSON.stringify(label))
      : null;
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
