import { HttpException } from '@nestjs/common';
import crypto from 'crypto';
import { DataSource, In } from 'typeorm';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { InstanceEntity } from '../instance/instance.entity';
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
  public constructor(private dataSource: DataSource) {}

  public async addDefaultUsers(
    program: ProgramEntity,
    addFieldValidation: boolean,
  ): Promise<void> {
    const fullAccessUser = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_FULL_ACCESS,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });

    const runProgramUser = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_RUN_PROGRAM,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_RUN_PROGRAM,
    });

    const personalDataUser = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_PERSONAL_DATA,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_PERSONAL_DATA,
    });

    const viewOnlyUser = await this.getOrSaveUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
    });

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.assignAidworker(fullAccessUser.id, program.id, [
      DefaultUserRole.RunProgram,
      DefaultUserRole.PersonalData,
    ]);
    await this.assignAidworker(runProgramUser.id, program.id, [
      DefaultUserRole.RunProgram,
    ]);
    await this.assignAidworker(personalDataUser.id, program.id, [
      DefaultUserRole.PersonalData,
    ]);
    await this.assignAidworker(viewOnlyUser.id, program.id, [
      DefaultUserRole.View,
    ]);

    if (addFieldValidation) {
      const fieldValidationUser = await this.getOrSaveUser({
        username:
          process.env.USERCONFIG_121_SERVICE_EMAIL_USER_FIELD_VALIDATION,
        password:
          process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FIELD_VALIDATION,
      });
      await this.assignAidworker(fieldValidationUser.id, program.id, [
        DefaultUserRole.FieldValidation,
      ]);
    }

    await this.assignAdminUserToProgram(program.id);
  }

  public async getOrSaveUser(userInput: any): Promise<UserEntity> {
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
    }
    return await programRepository.save(foundProgram);
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
    this.assignAidworker(adminUser.id, programId, [
      DefaultUserRole.ProgramAdmin,
    ]);
  }
}
