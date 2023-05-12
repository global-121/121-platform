import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramFspConfigurationEntity } from './program-fsp-configuration.entity';

@Injectable()
export class ProgramFspConfigurationService {
  @InjectRepository(ProgramFspConfigurationEntity)
  private readonly programFspConfigurationRepository: Repository<ProgramFspConfigurationEntity>;

  public async findByProgramId(
    programId: number,
  ): Promise<ProgramFspConfigurationEntity[]> {
    const programFspConfigurations =
      await this.programFspConfigurationRepository.find({
        where: { id: programId },
      });

    return programFspConfigurations;
  }
}
