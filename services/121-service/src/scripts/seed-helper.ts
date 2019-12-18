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

      await programRepository.save(program);
    }
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
