import { HttpException } from '@nestjs/common';
import { Connection, In } from 'typeorm';

import { ProgramEntity } from '../programs/program.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { UserEntity } from '../user/user.entity';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { InstanceEntity } from '../instance/instance.entity';
import crypto from 'crypto';
import { UserRoleEntity } from '../user/user-role.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { UserRole } from '../user-role.enum';
import { UserType } from '../user/user-type-enum';

export class SeedHelper {
  public constructor(private connection: Connection) {}

  public async addUser(userInput: any): Promise<UserEntity> {
    const userRepository = this.connection.getRepository(UserEntity);
    return await userRepository.save({
      username: userInput.username,
      password: crypto.createHmac('sha256', userInput.password).digest('hex'),
      userType: UserType.aidWorker,
    });
  }

  public async addInstance(
    exampleInstance: Record<string, any>,
  ): Promise<void> {
    const instanceRepository = this.connection.getRepository(InstanceEntity);

    const instanceDump = JSON.stringify(exampleInstance);
    const instance = JSON.parse(instanceDump);

    await instanceRepository.save(instance);
  }

  public async addProgram(programExample: any): Promise<ProgramEntity> {
    const programRepository = this.connection.getRepository(ProgramEntity);
    const fspRepository = this.connection.getRepository(
      FinancialServiceProviderEntity,
    );

    const programQuestionRepository = this.connection.getRepository(
      ProgramQuestionEntity,
    );

    const programExampleDump = JSON.stringify(programExample);
    const program = JSON.parse(programExampleDump);

    // Remove original program questions and add it to a sepperate variable
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
      let questionReturn = await programQuestionRepository.save(question);
      program.programQuestions.push(questionReturn);
    }

    // Remove original fsp questions and add it to a sepperate variable
    const fsps = program.financialServiceProviders;
    program.financialServiceProviders = [];

    for (let fsp of fsps) {
      let fspReturn = await fspRepository.findOne(fsp.id);
      program.financialServiceProviders.push(fspReturn);
    }
    return await programRepository.save(program);
  }

  public async addFsp(fspInput: any): Promise<void> {
    const exampleDump = JSON.stringify(fspInput);
    const fsp = JSON.parse(exampleDump);

    const fspRepository = this.connection.getRepository(
      FinancialServiceProviderEntity,
    );

    const fspAttributesRepository = this.connection.getRepository(
      FspAttributeEntity,
    );

    // Remove original custom criteria and add it to a separate variable
    const attributes = fsp.attributes;
    fsp.attributes = [];

    for (let attribute of attributes) {
      let customReturn = await fspAttributesRepository.save(attribute);
      fsp.attributes.push(customReturn);
    }

    await fspRepository.save(fsp);
  }

  public async assignAidworker(
    userId: number,
    programId: number,
    roles: UserRole[],
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
    this.assignAidworker(adminUser.id, programId, [UserRole.Admin]);
  }
}
