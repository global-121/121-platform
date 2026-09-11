import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProgramRegistrationProgramIdCounterEntity } from '@121-service/src/programs/entities/program-registration-program-id-counter.entity';

export class ProgramRegistrationProgramIdCounterRepository extends Repository<ProgramRegistrationProgramIdCounterEntity> {
  constructor(
    @InjectRepository(ProgramRegistrationProgramIdCounterEntity)
    baseRepository: Repository<ProgramRegistrationProgramIdCounterEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async createForProgram({
    programId,
  }: {
    programId: number;
  }): Promise<ProgramRegistrationProgramIdCounterEntity> {
    const counter = this.create({
      programId,
      lastRegistrationProgramId: 0,
    });

    return await this.save(counter);
  }
}
