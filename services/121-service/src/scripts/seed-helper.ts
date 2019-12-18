import { FinancialServiceProviderEntity } from './../programs/fsp/financial-service-provider.entity';
import { FspAttributeEntity } from './../programs/fsp/fsp-attribute.entity';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';

export class SeedHelper {
  public constructor(private connection: Connection) { }

  public async addPrograms(examplePrograms: Object[], authorId: number) {
    const programRepository = this.connection.getRepository(ProgramEntity);

    const userRepository = this.connection.getRepository(UserEntity);
    const author = await userRepository.findOne(authorId);
    const customCriteriumRepository = this.connection.getRepository(
      CustomCriterium,
    );

    for (let programExample of examplePrograms) {
      const programExampleDump = JSON.stringify(programExample);
      const program = JSON.parse(programExampleDump);
      program.author = author;

      // Remove original custom criteria and add it to a sepperate variable
      const customCriteria = program.customCriteria;
      program.customCriteria = [];


      for (let customCriterium of customCriteria) {
        let customReturn = await customCriteriumRepository.save(
          customCriterium,
        );
        program.customCriteria.push(customReturn);
      }

      // Remove original fsp criteria and add it to a sepperate variable
      const fsps = program.financialServiceProviders;
      program.customCriteria = [];

      for (let fsp of fsps) {
        let fspReturn = await customCriteriumRepository.findOne(
          fsp.id
        );
        program.financialServiceProviders.push(fspReturn);
      }

      await programRepository.save(program);
    }
  }

  public async addFsp(fspInput: any) {
    const exampleDump = JSON.stringify(fspInput);
    const fsp = JSON.parse(exampleDump);

    const fspRepository = this.connection.getRepository(
      FinancialServiceProviderEntity,
    );

    const fspAttributesRepository = this.connection.getRepository(
      FspAttributeEntity,
    );

    // Remove original custom criteria and add it to a sepperate variable
    const attributes = fsp.attributes;
    fsp.attributes = [];

    for (let attribute of attributes) {
      let customReturn = await fspAttributesRepository.save(
        attribute,
      );
      fsp.attributes.push(customReturn);
    }

    await fspRepository.save(fsp);
  }

  public async assignAidworker(userId: number, programId: number) {
    const userRepository = this.connection.getRepository(UserEntity);
    const programRepository = this.connection.getRepository(ProgramEntity);
    const program_d = await programRepository.findOne(programId); // Assign programId=1 ...
    const user_d = await userRepository.findOne(userId, {
      relations: ['assignedProgram'],
    });
    user_d.assignedProgram.push(program_d);
    await userRepository.save(user_d);
  }
}
