import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspConfigurationMapping } from '../../financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '../../financial-service-providers/financial-service-provider.entity';
import { CreateProgramFspConfigurationDto } from '../dto/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '../dto/update-program-fsp-configuration.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from './program-financial-service-provider-configuration.entity';

@Injectable()
export class ProgramFinancialServiceProviderConfigurationsService {
  @InjectRepository(ProgramFinancialServiceProviderConfigurationEntity)
  private readonly programFspConfigurationRepository: Repository<ProgramFinancialServiceProviderConfigurationEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;

  public async findByProgramId(
    programId: number,
  ): Promise<ProgramFinancialServiceProviderConfigurationEntity[]> {
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

    if (FspConfigurationMapping[fsp.name] === undefined) {
      throw new HttpException(
        `Fsp ${fsp.name} has no fsp config`,
        HttpStatus.NOT_FOUND,
      );
    } else {
      const allowedConfigForFsp = FspConfigurationMapping[fsp.name];
      if (!allowedConfigForFsp.includes(programFspConfigurationDto.name)) {
        throw new HttpException(
          `For fsp ${fsp.name} only the following values are allowed ${allowedConfigForFsp}. You tried to add ${programFspConfigurationDto.name}`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const programFspConfiguration = new ProgramFinancialServiceProviderConfigurationEntity();
    programFspConfiguration.programId = programId;
    programFspConfiguration.financialServiceProviderId = programFspConfigurationDto.fspId;
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
