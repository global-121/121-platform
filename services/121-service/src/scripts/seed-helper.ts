import { HttpException, HttpStatus } from '@nestjs/common';
import crypto from 'crypto';
import { DataSource, In } from 'typeorm';
import { DEBUG } from '../config';
import { FspConfigurationMapping } from '../fsp/enum/fsp-name.enum';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { InstanceEntity } from '../instance/instance.entity';
import { MessageTemplateEntity } from '../notifications/message-template/message-template.entity';
import { MessageTemplateService } from '../notifications/message-template/message-template.service';
import { ProgramFspConfigurationEntity } from '../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { AnswerTypes } from '../registration/enum/custom-data-attributes';
import { UserRoleEntity } from '../user/user-role.entity';
import { DefaultUserRole } from '../user/user-role.enum';
import { UserType } from '../user/user-type-enum';
import { UserEntity } from '../user/user.entity';

export class SeedHelper {
  public constructor(
    private dataSource: DataSource,
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  public async addDefaultUsers(
    program: ProgramEntity,
    debugScopeUsers: string[] = [],
  ): Promise<void> {
    const programAdminUser = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN,
    });

    const viewOnlyUser = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
    });

    const koboUser = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO,
    });

    const cvaManager = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
    });

    const cvaOfficer = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER,
    });

    const financeManager = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_MANAGER,
    });

    const financeOfficer = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_OFFICER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_OFFICER,
    });

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    if (programAdminUser) {
      await this.assignAidworker(programAdminUser.id, program.id, [
        DefaultUserRole.ProgramAdmin,
      ]);
    }
    if (viewOnlyUser) {
      await this.assignAidworker(viewOnlyUser.id, program.id, [
        DefaultUserRole.View,
      ]);
    }
    if (koboUser) {
      await this.assignAidworker(koboUser.id, program.id, [
        DefaultUserRole.KoboUser,
      ]);
    }
    if (cvaManager) {
      await this.assignAidworker(cvaManager.id, program.id, [
        DefaultUserRole.CvaManager,
      ]);
    }
    if (cvaOfficer) {
      await this.assignAidworker(cvaOfficer.id, program.id, [
        DefaultUserRole.CvaOfficer,
      ]);
    }
    if (financeManager) {
      await this.assignAidworker(financeManager.id, program.id, [
        DefaultUserRole.FinanceManager,
      ]);
    }
    if (financeOfficer) {
      await this.assignAidworker(financeOfficer.id, program.id, [
        DefaultUserRole.FinanceManager,
      ]);
    }

    if (debugScopeUsers && DEBUG) {
      for (const debugScopeUser of debugScopeUsers) {
        const scopedUser = await this.getOrSaveUser({
          username: `${debugScopeUser}@example.org`,
          password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN,
        });
        await this.assignAidworker(
          scopedUser.id,
          program.id,
          [DefaultUserRole.Admin],
          debugScopeUser,
        );
      }
    }

    await this.assignAdminUserToProgram(program.id);
  }

  public async getOrSaveUser(userInput: any): Promise<UserEntity> {
    if (!userInput.username || !userInput.password) {
      console.log(
        `User not created, because username or password not set in environment`,
      );
      return;
    }
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({
      where: { username: userInput.username },
    });
    if (user) {
      return user;
    } else {
      return await userRepository.save({
        username: userInput.username,
        password: crypto.createHmac('sha256', userInput.password).digest('hex'),
        userType: UserType.aidWorker,
      });
    }
  }

  public async addInstance(
    exampleInstance: Record<string, any>,
  ): Promise<void> {
    const instanceRepository = this.dataSource.getRepository(InstanceEntity);
    const instanceDump = JSON.stringify(exampleInstance);
    const instance = JSON.parse(instanceDump);
    if (instance.monitoringQuestion) {
      instance.monitoringQuestion.name = 'monitoringAnswer';
    }
    await instanceRepository.save(instance);
  }

  public async addProgram(programExample: any): Promise<ProgramEntity> {
    const programRepository = this.dataSource.getRepository(ProgramEntity);
    const fspRepository = this.dataSource.getRepository(
      FinancialServiceProviderEntity,
    );

    const programCustomAttributeRepository = this.dataSource.getRepository(
      ProgramCustomAttributeEntity,
    );
    const programQuestionRepository = this.dataSource.getRepository(
      ProgramQuestionEntity,
    );

    const programExampleDump = JSON.stringify(programExample);
    const program = JSON.parse(programExampleDump);

    const programReturn = await programRepository.save(program);

    // Remove original program custom attributes and add it to a separate variable
    const programCustomAttributes = program.programCustomAttributes;
    program.programCustomAttributes = [];
    if (programCustomAttributes) {
      for (const attribute of programCustomAttributes) {
        attribute.program = programReturn;
        await programCustomAttributeRepository.save(attribute);
      }
    }

    // Remove original program questions and add it to a separate variable
    const programQuestions = program.programQuestions;
    program.programQuestions = [];
    for (const question of programQuestions) {
      if (question.answerType === AnswerTypes.dropdown) {
        const scoringKeys = Object.keys(question.scoring);
        if (scoringKeys.length > 0) {
          const optionKeys = question.options.map(({ option }) => option);
          const areOptionScoringEqual =
            JSON.stringify(scoringKeys.sort()) ==
            JSON.stringify(optionKeys.sort());
          if (!areOptionScoringEqual) {
            throw new HttpException(
              'Option and scoring is not equal of question  ' + question.name,
              404,
            );
          }
        }
        // assert(optionsArray.includes(scoringkey));
      }
      question.program = program;
      await programQuestionRepository.save(question);
    }

    // Remove original fsp and add it to a separate variable
    const foundProgram = await programRepository.findOne({
      where: { id: programReturn.id },
    });
    const fsps = program.financialServiceProviders;
    foundProgram.financialServiceProviders = [];
    for (const fsp of fsps) {
      const fspReturn = await fspRepository.findOne({
        where: { fsp: fsp.fsp },
      });
      foundProgram.financialServiceProviders.push(fspReturn);
      if (fsp.configuration && fsp.configuration.length > 0) {
        for (const config of fsp.configuration) {
          await this.addFspConfiguration(config, programReturn.id, fspReturn);
        }
      }
    }

    return await programRepository.save(foundProgram);
  }

  private async addFspConfiguration(
    fspConfig: { name: string; value: string },
    programId: number,
    fsp: FinancialServiceProviderEntity,
  ): Promise<void> {
    if (FspConfigurationMapping[fsp.fsp] === undefined) {
      throw new HttpException(
        `Fsp ${fsp.fsp} has no fsp config`,
        HttpStatus.NOT_FOUND,
      );
    } else {
      const allowedConfigForFsp = FspConfigurationMapping[fsp.fsp];
      if (!allowedConfigForFsp.includes(fspConfig.name)) {
        throw new HttpException(
          `For fsp ${fsp.fsp} only the following values are allowed ${allowedConfigForFsp}. You tried to add ${fspConfig.name}`,
          HttpStatus.NOT_FOUND,
        );
      }
    }
    const value = process.env[fspConfig.value];
    const fspConfigEntity = new ProgramFspConfigurationEntity();
    fspConfigEntity.name = fspConfig.name;
    fspConfigEntity.value = value;
    fspConfigEntity.programId = programId;
    fspConfigEntity.fspId = fsp.id;
    const fspConfigRepo = this.dataSource.getRepository(
      ProgramFspConfigurationEntity,
    );
    await fspConfigRepo.save(fspConfigEntity);
  }

  public async addFsp(fspInput: any): Promise<void> {
    const exampleDump = JSON.stringify(fspInput);
    const fsp = JSON.parse(exampleDump);

    const fspRepository = this.dataSource.getRepository(
      FinancialServiceProviderEntity,
    );

    const fspQuestionRepository =
      this.dataSource.getRepository(FspQuestionEntity);

    // Remove original custom criteria and add it to a separate variable
    const questions = fsp.questions;
    fsp.questions = [];

    const fspReturn = await fspRepository.save(fsp);

    for (const question of questions) {
      question.fsp = fspReturn;
      const customReturn = await fspQuestionRepository.save(question);
      fsp.questions.push(customReturn);
    }
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
      scope: scope,
      user: user,
      program: await programRepository.findOne({
        where: {
          id: programId,
        },
      }),
      roles: await userRoleRepository.find({
        where: {
          role: In(roles),
        },
      }),
    });
  }

  public async assignAdminUserToProgram(programId: number): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const adminUser = await userRepository.findOne({
      where: { username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN },
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
    label: JSON,
  ): Promise<MessageTemplateEntity> {
    const messageTemplateEntity = new MessageTemplateEntity();
    messageTemplateEntity.program = program;
    messageTemplateEntity.type = type;
    messageTemplateEntity.label = label;
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
