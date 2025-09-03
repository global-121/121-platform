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
import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationPropertyEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration-property.entity';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectAidworkerAssignmentEntity } from '@121-service/src/projects/project-aidworker.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import { UserType } from '@121-service/src/user/user-type-enum';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

@Injectable()
export class SeedHelperService {
  public constructor(
    private dataSource: DataSource,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly projectFspConfigurationRepository: ProjectFspConfigurationRepository,
    private readonly httpService: CustomHttpService,
    private readonly axiosCallsService: AxiosCallsService,
  ) {}

  public async seedData(seedConfig: SeedConfigurationDto, isApiTests = false) {
    // Add organization
    const organizationPath = `organization/${seedConfig.organization}`;
    const organizationData = await this.importData(organizationPath);
    await this.addOrganization(organizationData);

    // ***** SET SEQUENCE *****
    // This is to keep PV and OCW project ids on respectively 2 and 3
    // This to prevent differences between our local and prod dbs so we are less prone to mistakes
    if (seedConfig.firstProjectId && seedConfig.firstProjectId !== 1) {
      await this.dataSource.query(
        `ALTER SEQUENCE "121-service".project_id_seq RESTART WITH ${seedConfig.firstProjectId};`,
      );
    }

    for (const project of seedConfig.projects) {
      // Add project
      const projectPath = `project/${project.project}`;
      const projectData = await this.importData(projectPath);
      const projectEntity = await this.addProject(projectData, isApiTests);

      // Add message templates
      await this.addMessageTemplates(project.messageTemplate, projectEntity);

      // Add default users
      const debugScopes = Object.values(DebugScope);
      await this.addDefaultUsers(
        projectEntity,
        seedConfig.includeDebugScopes ? debugScopes : [],
      );

      // Add registrations if provided this is only for demo purposes
      if (project.registrations) {
        await this.importRegistrations({
          projectId: projectEntity.id,
          registrationsFile: project.registrations,
          isTest: isApiTests,
        });
      }
    }
  }

  private async importRegistrations({
    projectId,
    registrationsFile,
    isTest,
  }: {
    projectId: number;
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
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const formHeaders = form.getHeaders();
    for (const key in formHeaders) {
      if (Object.prototype.hasOwnProperty.call(formHeaders, key)) {
        headers.push({
          name: key,
          value: formHeaders[key],
        });
      }
    }

    const url = `${this.axiosCallsService.getBaseUrl()}/projects/${projectId}/registrations/import`;
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
    project: ProjectEntity,
    debugScopeUsers: string[] = [],
  ): Promise<void> {
    const users = [
      {
        type: 'projectAdminUser',
        username: env.USERCONFIG_121_SERVICE_EMAIL_PROJECT_ADMIN,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_PROJECT_ADMIN,
        roles: [DefaultUserRole.ProjectAdmin],
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
        type: 'koboValidationnUser',
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
        await this.assignAidworker(savedUser.id, project.id, user.roles);
      }
    }

    if (debugScopeUsers && IS_DEVELOPMENT) {
      for (const debugScopeUser of debugScopeUsers) {
        const scopedUser = await this.getOrSaveUser({
          type: 'debugScopedUser',
          username: `${debugScopeUser}@example.org`,
          password: env.USERCONFIG_121_SERVICE_PASSWORD_PROJECT_ADMIN,
        });
        if (scopedUser) {
          await this.assignAidworker(
            scopedUser.id,
            project.id,
            [DefaultUserRole.CvaManager],
            debugScopeUser,
          );
        }
      }
    }

    await this.assignAdminUserToProject(project.id);
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

  public async addProject(
    projectExample: any,
    isApiTests: boolean,
  ): Promise<ProjectEntity> {
    const projectRepository = this.dataSource.getRepository(ProjectEntity);

    const projectRegistrationAttributeRepo = this.dataSource.getRepository(
      ProjectRegistrationAttributeEntity,
    );

    const projectExampleDump = JSON.stringify(projectExample);
    const projectFromJSON = JSON.parse(projectExampleDump);

    if (IS_DEVELOPMENT && !isApiTests) {
      projectFromJSON.published = true;
    }

    const projectReturn = await projectRepository.save(projectFromJSON);

    // Remove original project registration attributes and add it to a separate variable
    const projectRegistrationAttributes =
      projectFromJSON.projectRegistrationAttributes;
    projectFromJSON.projectRegistrationAttibutes = [];
    for (const attribute of projectRegistrationAttributes) {
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
      attribute.projectId = projectReturn.id;
      await projectRegistrationAttributeRepo.save(attribute);
    }

    const foundProject = await projectRepository.findOneOrFail({
      where: { id: Equal(projectReturn.id) },
    });
    const fspConfigArrayFromJson = projectFromJSON.projectFspConfigurations;
    foundProject.projectFspConfigurations = [];

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

      const projectFspConfig = this.createProjectFspConfiguration(
        fspConfigFromJson,
        fspObject,
        foundProject.id,
      );
      await this.projectFspConfigurationRepository.save(projectFspConfig);
    }

    return projectRepository.findOneByOrFail({ id: Equal(foundProject.id) });
  }

  private createProjectFspConfiguration(
    fspConfigFromJson: {
      fsp: Fsps;
      properties: { name: string; value: string }[] | undefined;
      name?: string;
      label: LocalizedString;
    },
    fspObject: FspDto,
    projectId: number,
  ): ProjectFspConfigurationEntity {
    const fspConfigEntity = new ProjectFspConfigurationEntity();
    fspConfigEntity.fspName = fspConfigFromJson.fsp;
    fspConfigEntity.properties = this.createProjectFspConfigurationProperties(
      fspConfigFromJson.properties ?? [],
    );
    fspConfigEntity.label = fspConfigFromJson.label
      ? fspConfigFromJson.label
      : fspObject.defaultLabel;
    fspConfigEntity.name = fspConfigFromJson.name
      ? fspConfigFromJson.name
      : fspObject.name;
    fspConfigEntity.transactions = [];
    fspConfigEntity.projectId = projectId;
    return fspConfigEntity;
  }

  private createProjectFspConfigurationProperties(
    propertiesFromJSON: { name: string; value: string }[],
  ): ProjectFspConfigurationPropertyEntity[] {
    const fspConfigPropertyEntities: ProjectFspConfigurationPropertyEntity[] =
      [];

    for (const property of propertiesFromJSON) {
      let fspConfigPropertyValue = property.value;
      if (typeof property.value === 'string') {
        // eslint-disable-next-line n/no-process-env -- Not all FSP-Config-properties are known in code, so we need to check with the runtime environment
        fspConfigPropertyValue = process.env[property.value] || property.value;
      }
      const fspConfigPropertyEntity =
        new ProjectFspConfigurationPropertyEntity();
      fspConfigPropertyEntity.name =
        property.name as FspConfigurationProperties;
      fspConfigPropertyEntity.value = fspConfigPropertyValue;
      fspConfigPropertyEntities.push(fspConfigPropertyEntity);
    }
    return fspConfigPropertyEntities;
  }

  public async assignAidworker(
    userId: number,
    projectId: number,
    roles: DefaultUserRole[] | string[],
    scope?: string,
  ): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const projectRepository = this.dataSource.getRepository(ProjectEntity);
    const userRoleRepository = this.dataSource.getRepository(UserRoleEntity);
    const assignmentRepository = this.dataSource.getRepository(
      ProjectAidworkerAssignmentEntity,
    );
    const user = await userRepository.findOneBy({
      id: userId,
    });
    await assignmentRepository.save({
      scope,
      user,
      project: await projectRepository.findOne({
        where: {
          id: Equal(projectId),
        },
      }),
      roles: await userRoleRepository.find({
        where: {
          role: In(roles),
        },
      }),
    } as DeepPartial<ProjectAidworkerAssignmentEntity>);
  }

  public async assignAdminUserToProject(projectId: number): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const adminUser = await userRepository.findOneOrFail({
      where: {
        username: Equal(env.USERCONFIG_121_SERVICE_EMAIL_ADMIN),
      },
    });
    await this.assignAidworker(adminUser.id, projectId, [
      DefaultUserRole.Admin,
    ]);
  }

  public async addMessageTemplates(
    messageTemplates: SeedMessageTemplateConfig,
    project: ProjectEntity,
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
          project,
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
    project: ProjectEntity,
    type: string,
    language: string,
    message: string,
    contentSid: string,
    isSendMessageTemplate: boolean,
    label: LocalizedString,
  ): Promise<MessageTemplateEntity> {
    const messageTemplateEntity = new MessageTemplateEntity();
    messageTemplateEntity.project = project;
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
        project.id,
        messageTemplateEntity.message,
      );
    }

    return messageTemplateEntity;
  }
}
