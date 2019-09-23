import { CredentialService } from './../sovrin/credential/credential.service';
import { ProgramService } from './../programs/program/program.service';
import { Connection } from 'typeorm';

import { UserEntity } from '../user/user.entity';

import { ProgramEntity } from '../programs/program/program.entity';

export class SeedHelper {
  public constructor(private connection: Connection) {}

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
