import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

export class ProgramRepository extends Repository<ProgramEntity> {
  constructor(
    @InjectRepository(ProgramEntity)
    private baseRepository: Repository<ProgramEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async findByIdOrFail(id: number): Promise<ProgramEntity> {
    const program = await this.baseRepository.findOne({
      where: { id: Equal(id) },
    });
    if (!program) {
      throw new Error(`Program with id ${id} not found`);
    }
    return program;
  }
}
