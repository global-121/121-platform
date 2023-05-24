import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProgramFspConfigurationDto } from '../dto/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '../dto/update-program-fsp-configuration.dto';
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
        where: { programId: programId },
      });

    return programFspConfigurations;
  }

  public async create(
    programId: number,
    programFspConfigurationDto: CreateProgramFspConfigurationDto,
  ): Promise<number> {
    const programFspConfiguration = new ProgramFspConfigurationEntity();
    programFspConfiguration.programId = programId;
    programFspConfiguration.fspId = programFspConfigurationDto.fspId;
    programFspConfiguration.name = programFspConfigurationDto.name;
    programFspConfiguration.value = programFspConfigurationDto.value;

    try {
      const resProgramFspConfiguration =
        await this.programFspConfigurationRepository.save(
          programFspConfiguration,
        );
      return resProgramFspConfiguration.id;
    } catch (error) {
      if (error['code'] === '23505') {
        throw new HttpException(
          `Conflict on unique constraint: ${error['constraint']}`,
          HttpStatus.CONFLICT,
        );
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  public async update(
    programId: number,
    programFspConfigurationId: number,
    updateProgramFspConfigurationDto: UpdateProgramFspConfigurationDto,
  ): Promise<number> {
    const result = await this.programFspConfigurationRepository.findOne({
      where: {
        id: programFspConfigurationId,
        programId: programId,
      },
    });
    if (!result) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    result.name = updateProgramFspConfigurationDto.name;
    result.value = updateProgramFspConfigurationDto.value;
    await this.programFspConfigurationRepository.save(result);
    return programFspConfigurationId;
  }

  public async delete(
    programId: number,
    programFspConfigurationId: number,
  ): Promise<void> {
    const result = await this.programFspConfigurationRepository.findOne({
      where: {
        id: programFspConfigurationId,
        programId: programId,
      },
    });
    if (!result) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    await this.programFspConfigurationRepository.delete({
      id: programFspConfigurationId,
    });
  }
}
