import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  public async getById(id: number): Promise<ProgramEntity> {
    const program = await this.baseRepository.findOne({ where: { id: id } });
    if (!program) {
      throw new Error(`Program with id ${id} not found`);
    }
    return program;
  }
}
