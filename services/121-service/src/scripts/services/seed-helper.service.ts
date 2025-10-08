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
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import {
  SeedConfigurationDto,
  SeedConfigurationProgramDto,
} from '@121-service/src/scripts/seed-configuration.dto';
import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

interface SeedingLogger {
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, error?: Error, data?: Record<string, any>): void;
  timing(message: string, duration: number): void;
}

class ConsoleSeedingLogger implements SeedingLogger {
  info(message: string, data?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] SEED INFO: ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  warn(message: string, data?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] SEED WARN: ${message}`;
    if (data) {
      console.warn(logMessage, data);
    } else {
      console.warn(logMessage);
    }
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] SEED ERROR: ${message}`;
    if (error) {
      console.error(logMessage, error.message, data || {});
    } else {
      console.error(logMessage, data || {});
    }
  }

  timing(message: string, duration: number): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SEED TIMING: ${message} (${duration}ms)`);
  }
}

@Injectable()
export class SeedHelperService {
  private readonly logger: SeedingLogger;

  public constructor(
    private dataSource: DataSource,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly httpService: CustomHttpService,
    private readonly axiosCallsService: AxiosCallsService,
  ) {
    this.logger = new ConsoleSeedingLogger();
  }

  public async seedData(
    seedConfig: SeedConfigurationDto,
    isApiTests = false,
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.info('Starting seed data process', {
      seedConfigName: seedConfig.name,
      isApiTests,
      programCount: seedConfig.programs.length,
      includeDebugScopes: seedConfig.includeDebugScopes,
    });

    try {
      await this.seedOrganization(seedConfig);
      await this.configureProgramSequence(seedConfig);
      await this.seedPrograms(seedConfig, isApiTests);

      const duration = Date.now() - startTime;
      this.logger.timing('Seed data process completed successfully', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Seed data process failed', error as Error, {
        duration,
      });
      throw error;
    }
  }

  private async seedOrganization(
    seedConfig: SeedConfigurationDto,
  ): Promise<void> {
    if (!seedConfig.organization) {
      this.logger.info(
        'No organization configuration provided, skipping organization setup',
      );
      return;
    }

    this.logger.info('Setting up organization', {
      organizationFile: seedConfig.organization,
    });
    const organizationPath = `organization/${seedConfig.organization}`;
    const organizationData = await this.importData(organizationPath);
    await this.addOrganization(organizationData);
    this.logger.info('Organization setup completed successfully');
  }

  private async configureProgramSequence(
    seedConfig: SeedConfigurationDto,
  ): Promise<void> {
    if (!seedConfig.firstProgramId || seedConfig.firstProgramId === 1) {
      this.logger.info('Using default program ID sequence');
      return;
    }

    this.logger.info('Configuring program ID sequence', {
      firstProgramId: seedConfig.firstProgramId,
    });
    await this.dataSource.query(
      `ALTER SEQUENCE "121-service".program_id_seq RESTART WITH ${seedConfig.firstProgramId};`,
    );
    this.logger.info('Program ID sequence configured successfully');
  }

  private async seedPrograms(
    seedConfig: SeedConfigurationDto,
    isApiTests: boolean,
  ): Promise<void> {
    this.logger.info('Starting program seeding', {
      programCount: seedConfig.programs.length,
    });

    for (let i = 0; i < seedConfig.programs.length; i++) {
      const program = seedConfig.programs[i];
      const programIndex = i + 1;

      this.logger.info(
        `Processing program ${programIndex}/${seedConfig.programs.length}`,
        {
          programFile: program.program,
          hasRegistrations: !!program.registrations,
        },
      );

      await this.seedSingleProgram(
        program,
        seedConfig,
        isApiTests,
        programIndex,
      );
    }

    this.logger.info('All programs seeded successfully');
  }

  private async seedSingleProgram(
    program: SeedConfigurationProgramDto,
    seedConfig: SeedConfigurationDto,
    isApiTests: boolean,
    programIndex: number,
  ): Promise<void> {
    const programStartTime = Date.now();

    try {
      // Add program
      const programPath = `program/${program.program}`;
      const programData = await this.importData(programPath);
      const programEntity = await this.addProgram(programData, isApiTests);
      this.logger.info(`Program entity created`, {
        programId: programEntity.id,
        programIndex,
      });

      // Add message templates
      await this.addMessageTemplates(program.messageTemplate, programEntity);
      this.logger.info('Message templates added', {
        programId: programEntity.id,
      });

      // Add default users
      const debugScopes = Object.values(DebugScope);
      await this.addDefaultUsers(
        programEntity,
        seedConfig.includeDebugScopes ? debugScopes : [],
      );
      this.logger.info('Default users added', {
        programId: programEntity.id,
        debugScopesIncluded: seedConfig.includeDebugScopes,
      });

      // Add registrations if provided
      if (program.registrations) {
        this.logger.info('Starting registration import', {
          programId: programEntity.id,
          registrationsFile: program.registrations,
          isTest: isApiTests,
        });
        await this.importRegistrations({
          programId: programEntity.id,
          registrationsFile: program.registrations,
          isTest: isApiTests,
        });
        this.logger.info('Registration import completed', {
          programId: programEntity.id,
        });
      } else {
        this.logger.info(
          'No registrations file provided, skipping registration import',
          {
            programId: programEntity.id,
          },
        );
      }

      const programDuration = Date.now() - programStartTime;
      this.logger.timing(
        `Program ${programIndex} seeded successfully`,
        programDuration,
      );
    } catch (error) {
      const programDuration = Date.now() - programStartTime;
      this.logger.error(
        `Failed to seed program ${programIndex}`,
        error as Error,
        {
          programFile: program.program,
          duration: programDuration,
        },
      );
      throw error;
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
  }): Promise<void> {
    const startTime = Date.now();

    try {
      const registrationsSubPath = `registrations/${registrationsFile}`;
      const registrationsFullPath = this.getSeedDataPath(registrationsSubPath);

      let filePathToUpload = registrationsFullPath;
      // Handle test mode: trim to first 5 lines to speed up tests and avoid large file uploads
      if (isTest) {
        this.logger.info('Creating limited CSV file for test mode', {
          originalFile: registrationsFile,
        });
        filePathToUpload = await this.getLimitedCsvFile(registrationsFullPath);
      }

      this.logger.info('Preparing registration import', {
        programId,
        registrationsFile,
        isTest,
        filePath: filePathToUpload,
      });

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

      const duration = Date.now() - startTime;
      this.logger.timing('Registration import API call completed', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Registration import failed', error as Error, {
        programId,
        registrationsFile,
        isTest,
        duration,
      });
      throw error;
    }
  }

  private async getLimitedCsvFile(sourcePath: string): Promise<string> {
    const limit = 5;
    const tempFilePath = path.join(
      os.tmpdir(),
      `test-${Date.now()}-${path.basename(sourcePath)}`,
    );

    this.logger.info('Creating limited CSV file for testing', {
      sourcePath: path.basename(sourcePath),
      limit,
      tempFilePath: path.basename(tempFilePath),
    });

    try {
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

      this.logger.info('Limited CSV file created successfully', {
        linesProcessed: lineCount,
        tempFilePath: path.basename(tempFilePath),
      });

      return tempFilePath;
    } catch (error) {
      this.logger.error('Failed to create limited CSV file', error as Error, {
        sourcePath: path.basename(sourcePath),
        tempFilePath: path.basename(tempFilePath),
      });
      throw error;
    }
  }

  private importData(subPath: string): any {
    try {
      const filePath = this.getSeedDataPath(subPath);
      this.logger.info('Importing seed data file', { filePath: subPath });

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      this.logger.info('Seed data file imported successfully', {
        filePath: subPath,
        dataSize: JSON.stringify(data).length,
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to import seed data file', error as Error, {
        filePath: subPath,
      });
      throw error;
    }
  }

  private getSeedDataPath(subPath: string): string {
    return join(__dirname, '../../seed-data', subPath);
  }

  public async addDefaultUsers(
    program: ProgramEntity,
    debugScopeUsers: string[] = [],
  ): Promise<void> {
    this.logger.info('Adding default users to program', {
      programId: program.id,
      debugScopeCount: debugScopeUsers.length,
    });

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

    let createdCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const savedUser = await this.getOrSaveUser(user);
      if (savedUser) {
        await this.assignAidworker(savedUser.id, program.id, user.roles);
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    this.logger.info('Standard users processed', {
      programId: program.id,
      createdCount,
      skippedCount,
      totalUsers: users.length,
    });

    if (debugScopeUsers && IS_DEVELOPMENT) {
      this.logger.info('Adding debug scope users', {
        programId: program.id,
        debugScopeCount: debugScopeUsers.length,
      });

      let debugUsersCreated = 0;
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
          debugUsersCreated++;
        }
      }

      this.logger.info('Debug scope users added', {
        programId: program.id,
        debugUsersCreated,
        requestedCount: debugScopeUsers.length,
      });
    }

    await this.assignAdminUserToProgram(program.id);
    this.logger.info('Admin user assigned to program', {
      programId: program.id,
    });
  }

  public async getOrSaveUser(userInput: {
    type: string;
    username?: string;
    password?: string;
  }): Promise<UserEntity | undefined> {
    if (!userInput.username || !userInput.password) {
      this.logger.warn('User not created due to missing credentials', {
        userType: userInput.type,
        hasUsername: !!userInput.username,
        hasPassword: !!userInput.password,
      });
      return;
    }

    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({
      where: { username: Equal(userInput.username) },
    });

    if (user) {
      this.logger.info('Existing user found', {
        userType: userInput.type,
        username: userInput.username,
        userId: user.id,
      });
      return user;
    } else {
      const newUser = await userRepository.save({
        username: userInput.username,
        password: crypto.createHmac('sha256', userInput.password).digest('hex'),
        userType: UserType.aidWorker,
        displayName: userInput.username.split('@')[0],
      });

      this.logger.info('New user created', {
        userType: userInput.type,
        username: userInput.username,
        userId: newUser.id,
      });

      return newUser;
    }
  }

  public async addOrganization(
    exampleOrganization: Record<string, any>,
  ): Promise<void> {
    try {
      this.logger.info('Creating organization entity', {
        organizationName: exampleOrganization.name || 'Unknown',
      });

      const organizationRepository =
        this.dataSource.getRepository(OrganizationEntity);
      const organizationDump = JSON.stringify(exampleOrganization);
      const organization = JSON.parse(organizationDump);
      const savedOrganization = await organizationRepository.save(organization);

      this.logger.info('Organization entity created successfully', {
        organizationId: savedOrganization.id,
        organizationName: savedOrganization.name,
      });
    } catch (error) {
      this.logger.error('Failed to create organization entity', error as Error);
      throw error;
    }
  }

  public async addProgram(
    programExample: any,
    isApiTests: boolean,
  ): Promise<ProgramEntity> {
    const startTime = Date.now();

    try {
      this.logger.info('Creating program entity', {
        programTitle:
          programExample.titlePortal || programExample.title || 'Unknown',
        isApiTests,
        isDevelopment: IS_DEVELOPMENT,
      });

      const programRepository = this.dataSource.getRepository(ProgramEntity);
      const programRegistrationAttributeRepo = this.dataSource.getRepository(
        ProgramRegistrationAttributeEntity,
      );

      const programExampleDump = JSON.stringify(programExample);
      const programFromJSON = JSON.parse(programExampleDump);

      if (IS_DEVELOPMENT && !isApiTests) {
        programFromJSON.published = true;
        this.logger.info('Program auto-published for development environment');
      }

      const programReturn = await programRepository.save(programFromJSON);
      this.logger.info('Program base entity created', {
        programId: programReturn.id,
        published: programReturn.published,
      });

      // Process program registration attributes
      await this.processProgramRegistrationAttributes(
        programFromJSON,
        programReturn.id,
        programRegistrationAttributeRepo,
      );

      // Process FSP configurations
      await this.processProgramFspConfigurations(
        programFromJSON,
        programReturn.id,
      );

      const finalProgram = await programRepository.findOneByOrFail({
        id: Equal(programReturn.id),
      });

      const duration = Date.now() - startTime;
      this.logger.timing('Program creation completed', duration);
      this.logger.info('Program fully configured', {
        programId: finalProgram.id,
        attributeCount:
          programFromJSON.programRegistrationAttributes?.length || 0,
        fspConfigCount: programFromJSON.programFspConfigurations?.length || 0,
      });

      return finalProgram;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Program creation failed', error as Error, {
        programTitle:
          programExample.titlePortal || programExample.title || 'Unknown',
        duration,
      });
      throw error;
    }
  }

  private async processProgramRegistrationAttributes(
    programFromJSON: any,
    programId: number,
    programRegistrationAttributeRepo: any,
  ): Promise<void> {
    const programRegistrationAttributes =
      programFromJSON.programRegistrationAttributes || [];

    this.logger.info('Processing program registration attributes', {
      programId,
      attributeCount: programRegistrationAttributes.length,
    });

    programFromJSON.programRegistrationAttibutes = [];

    for (const attribute of programRegistrationAttributes) {
      attribute.isRequired = attribute.isRequired || false;

      if (attribute.answerType === RegistrationAttributeTypes.dropdown) {
        this.validateDropdownScoring(attribute);
      }

      attribute.programId = programId;
      await programRegistrationAttributeRepo.save(attribute);
    }

    this.logger.info('Program registration attributes processed successfully', {
      programId,
      processedCount: programRegistrationAttributes.length,
    });
  }

  private validateDropdownScoring(attribute: any): void {
    const scoringKeys = Object.keys(attribute.scoring || {});
    if (scoringKeys.length > 0) {
      const optionKeys =
        attribute.options?.map(({ option }: any) => option) || [];
      const areOptionScoringEqual =
        JSON.stringify(scoringKeys.sort()) ===
        JSON.stringify(optionKeys.sort());

      if (!areOptionScoringEqual) {
        const error = new HttpException(
          `Option and scoring is not equal of question ${attribute.name}`,
          404,
        );
        this.logger.error('Dropdown scoring validation failed', error, {
          attributeName: attribute.name,
          scoringKeys,
          optionKeys,
        });
        throw error;
      }
    }
  }

  private async processProgramFspConfigurations(
    programFromJSON: any,
    programId: number,
  ): Promise<void> {
    const fspConfigArrayFromJson =
      programFromJSON.programFspConfigurations || [];

    this.logger.info('Processing FSP configurations', {
      programId,
      fspConfigCount: fspConfigArrayFromJson.length,
    });

    for (const fspConfigFromJson of fspConfigArrayFromJson) {
      const fspObject = FSP_SETTINGS.find(
        (fsp) => fsp.name === fspConfigFromJson.fsp,
      );

      if (!fspObject) {
        const error = new HttpException(
          `FSP with name ${fspConfigFromJson.fsp} not found in FSP_SETTINGS`,
          HttpStatus.NOT_FOUND,
        );
        this.logger.error('FSP configuration not found', error, {
          programId,
          fspName: fspConfigFromJson.fsp,
        });
        throw error;
      }

      const programFspConfig = this.createProgramFspConfiguration(
        fspConfigFromJson,
        fspObject,
        programId,
      );
      await this.programFspConfigurationRepository.save(programFspConfig);

      this.logger.info('FSP configuration saved', {
        programId,
        fspName: fspConfigFromJson.fsp,
        configName: fspConfigFromJson.name,
      });
    }

    this.logger.info('All FSP configurations processed successfully', {
      programId,
      processedCount: fspConfigArrayFromJson.length,
    });
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
    const startTime = Date.now();

    try {
      this.logger.info('Adding message templates to program', {
        programId: program.id,
        templateTypeCount: Object.keys(messageTemplates).length,
      });

      const messageTemplateRepo = this.dataSource.getRepository(
        MessageTemplateEntity,
      );

      let templatesCreated = 0;

      for (const messageType of Object.keys(messageTemplates)) {
        const messageObject = messageTemplates[messageType].message;
        const contentSidObject = messageTemplates[messageType].contentSid;

        const messageLanguages = messageObject
          ? Object.keys(messageObject)
          : [];
        const contentSidLanguages = contentSidObject
          ? Object.keys(contentSidObject)
          : [];
        const languages = [
          ...new Set([...messageLanguages, ...contentSidLanguages]),
        ];

        this.logger.info('Processing message template type', {
          programId: program.id,
          messageType,
          languageCount: languages.length,
          languages,
        });

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
          templatesCreated++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.timing('Message templates added successfully', duration);
      this.logger.info('Message template creation summary', {
        programId: program.id,
        templatesCreated,
        templateTypes: Object.keys(messageTemplates).length,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Message template creation failed', error as Error, {
        programId: program.id,
        duration,
      });
      throw error;
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
    try {
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

      this.logger.info('Message template created', {
        programId: program.id,
        type,
        language,
        hasMessage: !!message,
        hasContentSid: !!contentSid,
        isSendTemplate: isSendMessageTemplate,
      });

      return messageTemplateEntity;
    } catch (error) {
      this.logger.error('Failed to create message template', error as Error, {
        programId: program.id,
        type,
        language,
      });
      throw error;
    }
  }
}
