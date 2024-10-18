import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';

@Injectable()
export class ProgramFinancialServiceProviderConfigurationsService {
  @InjectRepository(ProgramFinancialServiceProviderConfigurationEntity)
  private readonly programFspConfigurationRepository: Repository<ProgramFinancialServiceProviderConfigurationEntity>;

  public async findByProgramId(
    programId: number,
  ): Promise<ProgramFinancialServiceProviderConfigurationEntity[]> {
    const programFspConfigurations =
      await this.programFspConfigurationRepository.find({
        where: { programId: Equal(programId) },
      });

    return programFspConfigurations;
  }

  // public async create(
  //   programId: number,
  //   programFspConfigurationDto: CreateProgramFspConfigurationDto,
  // ): Promise<number> {
  //   const fsp = FINANCIAL_SERVICE_PROVIDERS.find(
  //     (fsp) =>
  //       fsp.name === programFspConfigurationDto.financialServiceProviderName,
  //   );
  //   if (!fsp) {
  //     throw new HttpException(
  //       `No fsp found with name ${programFspConfigurationDto.financialServiceProviderName}`,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  // ##TODO: This function should be split up in 2. One to create fspConfig and one to create fspConfigProperties

  // if (FinancialServiceProviderConfigurationMapping[fsp.name] === undefined) {
  //   throw new HttpException(
  //     `Fsp ${fsp.name} has no fsp config`,
  //     HttpStatus.NOT_FOUND,
  //   );
  // } else {
  //   const allowedConfigForFsp =
  //     FinancialServiceProviderConfigurationMapping[fsp.name];
  //   if (!allowedConfigForFsp.includes(programFspConfigurationDto.name)) {
  //     throw new HttpException(
  //       `For fsp ${fsp.name} only the following values are allowed ${allowedConfigForFsp}. You tried to add ${programFspConfigurationDto.name}`,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  // }

  // const programFspConfiguration =
  //   new ProgramFinancialServiceProviderConfigurationEntity();
  // programFspConfiguration.programId = programId;
  // programFspConfiguration.financialServiceProvider =
  //   programFspConfigurationDto.financialServiceProviderName as FinancialServiceProviderName;
  // programFspConfiguration.name = programFspConfigurationDto.name;
  // programFspConfiguration.value = programFspConfigurationDto.value;

  // try {
  //   const resProgramFspConfiguration =
  //     await this.programFspConfigurationRepository.save(
  //       programFspConfiguration,
  //     );
  //   return resProgramFspConfiguration.id;
  // } catch (error) {
  //   if (error['code'] === '23505') {
  //     throw new HttpException(
  //       `Conflict on unique constraint: ${error['constraint']}`,
  //       HttpStatus.CONFLICT,
  //     );
  //   } else {
  //     throw new HttpException(
  //       'Internal server error',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  // }

  // public async update(
  //   programId: number,
  //   programFspConfigurationName: string,
  //   updateProgramFspConfigurationDto: UpdateProgramFspConfigurationDto,
  // ): Promise<string> {
  //   const result = await this.programFspConfigurationRepository.findOne({
  //     where: {
  //       name: Equal(programFspConfigurationName),
  //       programId: Equal(programId),
  //     },
  //   });
  //   if (!result) {
  //     throw new HttpException('Not found', HttpStatus.NOT_FOUND);
  //   }
  //   // Only update the label in this API call. I cannot imagine a use case where we would want to update the name or fsp name
  //   result.label = updateProgramFspConfigurationDto.label;

  //   await this.programFspConfigurationRepository.save(result);
  //   return programFspConfigurationName;
  // }

  // public async delete(
  //   programId: number,
  //   programFspConfigurationId: number,
  // ): Promise<void> {
  //   const result = await this.programFspConfigurationRepository.findOne({
  //     where: {
  //       id: Equal(programFspConfigurationId),
  //       programId: Equal(programId),
  //     },
  //   });
  //   if (!result) {
  //     throw new HttpException('Not found', HttpStatus.NOT_FOUND);
  //   }
  //   await this.programFspConfigurationRepository.delete({
  //     id: programFspConfigurationId,
  //   });
  // }
}
