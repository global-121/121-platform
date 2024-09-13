import { HttpException, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { DataSource, DeepPartial, Equal, In } from 'typeorm';

import { DEBUG } from '@121-service/src/config';
import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { FINANCIAL_SERVICE_PROVIDERS } from '@121-service/src/financial-service-providers/financial-service-providers.const';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { AnswerTypes } from '@121-service/src/registration/enum/custom-data-attributes';
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
  ) {}
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
        type: 'koboUser',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO,
        roles: [DefaultUserRole.KoboUser],
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

  public async addOneDefaultAdminUser(
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
        type: 'koboUser',
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO,
        roles: [DefaultUserRole.KoboUser],
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
      await this.getOrSaveUser(user);
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
    const programFspConfigRepository = this.dataSource.getRepository(
      ProgramFinancialServiceProviderConfigurationEntity,
    );

    const programRegistrationAttributeRepo = this.dataSource.getRepository(
      ProgramRegistrationAttributeEntity,
    );

    const programExampleDump = JSON.stringify(programExample);
    const programFromJSON = JSON.parse(programExampleDump);

    if (DEBUG && !isApiTests) {
      programFromJSON.published = true;
    }

    const programReturn = await programRepository.save(programFromJSON);

    // Remove original program questions and add it to a separate variable
    const programRegistrationAttributes =
      programFromJSON.programRegistrationAttributes;
    programFromJSON.programRegistrationAttibutes = [];
    for (const attribute of programRegistrationAttributes) {
      attribute['isRequired'] = attribute['isRequired'] || true;
      if (attribute.answerType === AnswerTypes.dropdown) {
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
      programFromJSON.programFinancialServiceProviderConfiguration;
    foundProgram.programFinancialServiceProviderConfigurations = [];

    // ##TODO use the fspConfigService later to create the fspConfigEntities after this has been implemented
    for (const fspConfigFromJson of fspConfigArrayFromJson) {
      const fspDto = FINANCIAL_SERVICE_PROVIDERS.find(
        (fsp) => fsp.name === fspConfigFromJson.financialServiceProvider,
      );
      if (!fspDto) {
        throw new HttpException(
          `FSP with name ${fspConfigFromJson.financialServiceProvider} not found in FINANCIAL_SERVICE_PROVIDERS`,
          404,
        );
      }

      const programFspConfig = this.createProggramFspConfiguration(
        fspConfigFromJson,
        fspDto,
      );
      programFspConfig.programId = foundProgram.id;
      await programFspConfigRepository.save(programFspConfig);
    }

    return programRepository.findOneByOrFail({ id: Equal(foundProgram.id) });
  }

  private createProggramFspConfiguration(
    fspConfig: {
      financialServiceProvider: FinancialServiceProviderName;
      properties: { name: string; value: string }[];
    },
    fspDto: FinancialServiceProviderDto,
  ): ProgramFinancialServiceProviderConfigurationEntity {
    const programFspConfig =
      new ProgramFinancialServiceProviderConfigurationEntity();
    programFspConfig.financialServiceProviderName =
      fspConfig.financialServiceProvider;
    programFspConfig.properties = this.createProggramFspConfigurationProperties(
      programFspConfig,
      fspConfig.properties,
    );

    programFspConfig.label = fspDto.defaultLabel;
    // Se name to the same value as the fsp name as our default seed do not have multiple fsp with the same name atm
    programFspConfig.name = fspDto.name;
    programFspConfig.financialServiceProviderName =
      fspConfig.financialServiceProvider;
    return programFspConfig;
  }

  private createProggramFspConfigurationProperties(
    programFspConfig: ProgramFinancialServiceProviderConfigurationEntity,
    propertiesFromJSON: { name: string; value: string }[],
  ): ProgramFinancialServiceProviderConfigurationPropertyEntity[] {
    const fspConfigProperties: ProgramFinancialServiceProviderConfigurationPropertyEntity[] =
      [];
    for (const property of propertiesFromJSON) {
      let fspConfigPropertyValue = property.value;
      if (typeof property.value === 'string') {
        fspConfigPropertyValue = process.env[property.value] || property.value;
      }
      const fspConfigProperty =
        new ProgramFinancialServiceProviderConfigurationPropertyEntity();
      fspConfigProperty.name = property.name;
      fspConfigProperty.value = fspConfigPropertyValue;
      fspConfigProperty.programFinancialServiceProviderConfiguration =
        programFspConfig;
      fspConfigProperties.push(fspConfigProperty);
    }
    return fspConfigProperties;
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
    messageTemplatesExample: any,
    program: ProgramEntity,
  ): Promise<void> {
    const messageTemplatesExampleDump = JSON.stringify(messageTemplatesExample);
    const messageTemplates = JSON.parse(messageTemplatesExampleDump);

    const messageTemplateRepo = this.dataSource.getRepository(
      MessageTemplateEntity,
    );
    for (const messageType of Object.keys(messageTemplates)) {
      const languages = messageTemplates[messageType].message;
      for (const language of Object.keys(languages)) {
        const template = await this.createMessageTemplate(
          program,
          messageType,
          language,
          languages[language],
          messageTemplates[messageType].isWhatsappTemplate,
          messageTemplates[messageType].isSendMessageTemplate,
          messageTemplates[messageType].label,
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
    isWhatsappTemplate: boolean,
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
    messageTemplateEntity.isWhatsappTemplate = isWhatsappTemplate;
    messageTemplateEntity.isSendMessageTemplate = isSendMessageTemplate;

    await this.messageTemplateService.validatePlaceholders(
      program.id,
      messageTemplateEntity.message,
    );

    return messageTemplateEntity;
  }
}
