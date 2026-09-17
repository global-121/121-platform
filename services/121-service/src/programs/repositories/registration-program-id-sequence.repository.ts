import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegistrationProgramIdSequenceEntity } from '@121-service/src/programs/entities/registration-program-id-sequence.entity';

export class RegistrationProgramIdSequenceRepository extends Repository<RegistrationProgramIdSequenceEntity> {
  constructor(
    @InjectRepository(RegistrationProgramIdSequenceEntity)
    baseRepository: Repository<RegistrationProgramIdSequenceEntity>,
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
  }): Promise<RegistrationProgramIdSequenceEntity> {
    const sequence = this.create({
      programId,
      lastRegistrationProgramId: 0,
    });

    return await this.save(sequence);
  }
}
