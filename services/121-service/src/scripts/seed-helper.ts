import { MonitoringQuestionEntity } from './../instance/monitoring-question.entity';
import { HttpException } from '@nestjs/common';
import { Connection, In } from 'typeorm';

import { ProgramEntity } from '../programs/program.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { UserEntity } from '../user/user.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { InstanceEntity } from '../instance/instance.entity';
import crypto from 'crypto';
import { UserRoleEntity } from '../user/user-role.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { DefaultUserRole } from '../user/user-role.enum';
import { UserType } from '../user/user-type-enum';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';

export class SeedHelper {
  public constructor(private connection: Connection) {}

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
    const userRepository = this.connection.getRepository(UserEntity);
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
    const instanceRepository = this.connection.getRepository(InstanceEntity);
    const instanceDump = JSON.stringify(exampleInstance);
    const instance = JSON.parse(instanceDump);
    if (instance.monitoringQuestion) {
      instance.monitoringQuestion.name = 'monitoringAnswer';
    }
    await instanceRepository.save(instance);
  }

  public async addProgram(programExample: any): Promise<ProgramEntity> {
    const programRepository = this.connection.getRepository(ProgramEntity);
    const fspRepository = this.connection.getRepository(
      FinancialServiceProviderEntity,
    );

    const programCustomAttributeRepository = this.connection.getRepository(
      ProgramCustomAttributeEntity,
    );
    const programQuestionRepository = this.connection.getRepository(
      ProgramQuestionEntity,
    );

    const programExampleDump = JSON.stringify(programExample);
    const program = JSON.parse(programExampleDump);

    const programReturn = await programRepository.save(program);

    // Remove original program custom attributes and add it to a separate variable
    const programCustomAttributes = program.programCustomAttributes;
    program.programCustomAttributes = [];
    if (programCustomAttributes) {
      for (let attribute of programCustomAttributes) {
        attribute.program = programReturn;
        await programCustomAttributeRepository.save(attribute);
      }
    }

    // Remove original program questions and add it to a separate variable
    const programQuestions = program.programQuestions;
    program.programQuestions = [];
    for (let question of programQuestions) {
      if (question.answerType === 'dropdown') {
        const scoringKeys = Object.keys(question.scoring);
        if (scoringKeys.length > 0) {
          const optionKeys = question.options.map(({ option }) => option);
          const areOptionScoriingEqual =
            JSON.stringify(scoringKeys.sort()) ==
            JSON.stringify(optionKeys.sort());
          if (!areOptionScoriingEqual) {
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
    for (let fsp of fsps) {
      let fspReturn = await fspRepository.findOne({
        where: { fsp: fsp.fsp },
      });
      foundProgram.financialServiceProviders.push(fspReturn);
    }
    return await programRepository.save(foundProgram);
  }

  public async addFsp(fspInput: any): Promise<void> {
    const exampleDump = JSON.stringify(fspInput);
    const fsp = JSON.parse(exampleDump);

    const fspRepository = this.connection.getRepository(
      FinancialServiceProviderEntity,
    );

    const fspQuestionRepository = this.connection.getRepository(
      FspQuestionEntity,
    );

    // Remove original custom criteria and add it to a separate variable
    const questions = fsp.questions;
    fsp.questions = [];

    const fspReturn = await fspRepository.save(fsp);

    for (let question of questions) {
      question.fsp = fspReturn;
      let customReturn = await fspQuestionRepository.save(question);
      fsp.questions.push(customReturn);
    }
  }

  public async assignAidworker(
    userId: number,
    programId: number,
    roles: DefaultUserRole[] | string[],
  ): Promise<void> {
    const userRepository = this.connection.getRepository(UserEntity);
    const programRepository = this.connection.getRepository(ProgramEntity);
    const userRoleRepository = this.connection.getRepository(UserRoleEntity);
    const assignmentRepository = this.connection.getRepository(
      ProgramAidworkerAssignmentEntity,
    );
    const user = await userRepository.findOne(userId);
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
    const userRepository = this.connection.getRepository(UserEntity);
    const adminUser = await userRepository.findOne({
      where: { username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN },
    });
    this.assignAidworker(adminUser.id, programId, [DefaultUserRole.Admin]);
  }
}
