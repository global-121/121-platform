import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import fs from 'fs';
import { join } from 'path';
import { DataSource, DeepPartial, Equal, In } from 'typeorm';

import { DEBUG } from '@121-service/src/config';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/fsps/fsp.dto';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import { UserType } from '@121-service/src/user/user-type-enum';

@Injectable()
export class SeedHelper {
  public constructor(
    private dataSource: DataSource,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly programFspConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
  ) {}

  public async seedData(seedConfig: SeedConfigurationDto, isApiTests = false) {
    // Add organization
    const organizationPath = `organization/${seedConfig.organization}`;
    const organizationData = await this.importData(organizationPath);
    await this.addOrganization(organizationData);

    // ***** SET SEQUENCE *****
    // This is to keep PV and OCW program ids on respectively 2 and 3
    // This to prevent differences between our local and prod dbs so we are less prone to mistakes
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
    }
  }

  private importData(subPath: string) {
    const filePath = join(
      __dirname,
      '../seed-data', // TODO: move seed-data folder into scripts folder? Rename scripts folder?
      subPath,
    );
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  public async addDefaultUsers(
    program: ProgramEntity,
    debugScopeUsers: string[] = [],
  ): Promise<void> {
    const users = [
      {
        type: 'programAdminUser',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN,
        roles: [DefaultUserRole.ProgramAdmin],
      },
      {
        type: 'viewOnlyUser',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
        roles: [DefaultUserRole.View],
      },
      {
        type: 'koboRegistrationUser',
        username:
          process.env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_REGISTRATION,
        password:
          process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO_REGISTRATION,
        roles: [DefaultUserRole.KoboRegistrationUser],
      },
      {
        type: 'koboValidationnUser',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_VALIDATION,
        password:
          process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO_VALIDATION,
        roles: [DefaultUserRole.KoboValidationUser],
      },
      {
        type: 'cvaManager',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
        roles: [DefaultUserRole.CvaManager],
      },
      {
        type: 'cvaOfficer',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER,
        roles: [DefaultUserRole.CvaOfficer],
      },
      {
        type: 'financeManager',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_MANAGER,
        roles: [DefaultUserRole.FinanceManager],
      },
      {
        type: 'financeOfficer',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_OFFICER,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_OFFICER,
        roles: [DefaultUserRole.FinanceOfficer],
      },
      {
        type: 'ViewWithoutPII',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_VIEW_WITHOUT_PII,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_VIEW_WITHOUT_PII,
        roles: [DefaultUserRole.ViewWithoutPII],
      },
    ];

    for (const user of users) {
      const savedUser = await this.getOrSaveUser(user);
      if (savedUser) {
        await this.assignAidworker(savedUser.id, program.id, user.roles);
      }
    }

    if (debugScopeUsers && DEBUG) {
      for (const debugScopeUser of debugScopeUsers) {
        const scopedUser = await this.getOrSaveUser({
          type: 'debugScopedUser',
          username: `${debugScopeUser}@example.org`,
          password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN,
        });
        if (scopedUser) {
          await this.assignAidworker(
            scopedUser.id,
            program.id,
            [DefaultUserRole.Admin],
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

  public async addOrganization(
    exampleOrganization: Record<string, any>,
  ): Promise<void> {
    const organizationRepository =
      this.dataSource.getRepository(OrganizationEntity);
    const organizationDump = JSON.stringify(exampleOrganization);
    const organization = JSON.parse(organizationDump);
    await organizationRepository.save(organization);
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

    if (DEBUG && !isApiTests) {
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
    const fspConfigArrayFromJson =
      programFromJSON.programFinancialServiceProviderConfigurations;
    foundProgram.programFspConfigurations = [];

    for (const fspConfigFromJson of fspConfigArrayFromJson) {
      const financialServiceProviderObject =
        FINANCIAL_SERVICE_PROVIDER_SETTINGS.find(
          (fsp) => fsp.name === fspConfigFromJson.financialServiceProvider,
        );
      if (!financialServiceProviderObject) {
        throw new HttpException(
          `FSP with name ${fspConfigFromJson.financialServiceProvider} not found in FINANCIAL_SERVICE_PROVIDER_SETTINGS`,
          HttpStatus.NOT_FOUND,
        );
      }

      const programFspConfig = this.createProgramFspConfiguration(
        fspConfigFromJson,
        financialServiceProviderObject,
        foundProgram.id,
      );
      await this.programFspConfigurationRepository.save(programFspConfig);
    }

    return programRepository.findOneByOrFail({ id: Equal(foundProgram.id) });
  }

  private createProgramFspConfiguration(
    fspConfigFromJson: {
      financialServiceProvider: Fsps;
      properties: { name: string; value: string }[] | undefined;
      name?: string;
      label: LocalizedString;
    },
    financialServiceProviderObject: FinancialServiceProviderDto,
    programId: number,
  ): ProgramFspConfigurationEntity {
    const fspConfigEntity = new ProgramFspConfigurationEntity();
    fspConfigEntity.fspName = fspConfigFromJson.financialServiceProvider;
    fspConfigEntity.properties = this.createProgramFspConfigurationProperties(
      fspConfigFromJson.properties ?? [],
    );
    fspConfigEntity.label = fspConfigFromJson.label
      ? fspConfigFromJson.label
      : financialServiceProviderObject.defaultLabel;
    fspConfigEntity.name = fspConfigFromJson.name
      ? fspConfigFromJson.name
      : financialServiceProviderObject.name;
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
        username: Equal(process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN!),
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
