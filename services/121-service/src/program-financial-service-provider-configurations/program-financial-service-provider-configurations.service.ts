import { FinancialServiceProviderConfigurationMapping } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { CreateProgramFspConfigurationDto } from '@121-service/src/programs/dto/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/programs/dto/update-program-fsp-configuration.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

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
        where: { programId: Equal(programId) },
      });

    return programFspConfigurations;
  }

  public async create(
    programId: number,
    programFspConfigurationDto: CreateProgramFspConfigurationDto,
  ): Promise<number> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { id: Equal(programFspConfigurationDto.fspId) },
    });
    if (!fsp) {
      throw new HttpException(
        `No fsp found with id ${programFspConfigurationDto.fspId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (FinancialServiceProviderConfigurationMapping[fsp.fsp] === undefined) {
      throw new HttpException(
        `Fsp ${fsp.fsp} has no fsp config`,
        HttpStatus.NOT_FOUND,
      );
    } else {
      const allowedConfigForFsp =
        FinancialServiceProviderConfigurationMapping[fsp.fsp];
      if (!allowedConfigForFsp.includes(programFspConfigurationDto.name)) {
        throw new HttpException(
          `For fsp ${fsp.fsp} only the following values are allowed ${allowedConfigForFsp}. You tried to add ${programFspConfigurationDto.name}`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const programFspConfiguration =
      new ProgramFinancialServiceProviderConfigurationEntity();
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
        id: Equal(programFspConfigurationId),
        programId: Equal(programId),
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
        id: Equal(programFspConfigurationId),
        programId: Equal(programId),
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
