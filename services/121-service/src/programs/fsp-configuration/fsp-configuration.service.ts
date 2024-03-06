import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspConfigurationMapping } from '../../fsp/enum/fsp-name.enum';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { CreateProgramFspConfigurationDto } from '../dto/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '../dto/update-program-fsp-configuration.dto';
import { ProgramFspConfigurationEntity } from './program-fsp-configuration.entity';

@Injectable()
export class ProgramFspConfigurationService {
  @InjectRepository(ProgramFspConfigurationEntity)
  private readonly programFspConfigurationRepository: Repository<ProgramFspConfigurationEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;

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
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { id: programFspConfigurationDto.fspId },
    });
    if (!fsp) {
      throw new HttpException(
        `No fsp found with id ${programFspConfigurationDto.fspId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (FspConfigurationMapping[fsp.fsp] === undefined) {
      throw new HttpException(
        `Fsp ${fsp.fsp} has no fsp config`,
        HttpStatus.NOT_FOUND,
      );
    } else {
      const allowedConfigForFsp = FspConfigurationMapping[fsp.fsp];
      if (!allowedConfigForFsp.includes(programFspConfigurationDto.name)) {
        throw new HttpException(
          `For fsp ${fsp.fsp} only the following values are allowed ${allowedConfigForFsp}. You tried to add ${programFspConfigurationDto.name}`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const programFspConfiguration = new ProgramFspConfigurationEntity();
    programFspConfiguration.programId = programId;
    programFspConfiguration.fspId = programFspConfigurationDto.fspId;
    programFspConfiguration.name = programFspConfigurationDto.name;
    programFspConfiguration.value = this.formatInputValue(
      programFspConfigurationDto.value,
    );

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
    result.value = this.formatInputValue(
      updateProgramFspConfigurationDto.value,
    );
    await this.programFspConfigurationRepository.save(result);
    return programFspConfigurationId;
  }

  private formatInputValue(value: string | string[]): string {
    // check if value is an environment variable

    let error = false;
    if (Array.isArray(value)) {
      for (const element of value) {
        if (typeof element !== 'string') {
          error = true;
        }
      }
    } else if (typeof value !== 'string') {
      error = true;
    }
    if (error) {
      throw new HttpException(
        'Invalid value type. Must be string or array of strings.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return Array.isArray(value) ? JSON.stringify(value) : value;
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
