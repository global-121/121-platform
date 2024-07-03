import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

export class ProgramFinancialServiceProviderConfigurationRepository extends Repository<ProgramFinancialServiceProviderConfigurationEntity> {
  constructor(
    @InjectRepository(ProgramFinancialServiceProviderConfigurationEntity)
    private baseRepository: Repository<ProgramFinancialServiceProviderConfigurationEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async findByProgramIdAndFinancialServiceProviderName(
    programId: number,
    financialServiceProviderName: FinancialServiceProviderName,
  ): Promise<ProgramFinancialServiceProviderConfigurationEntity[]> {
    return await this.baseRepository.find({
      where: {
        programId: Equal(programId),
        fsp: { fsp: Equal(financialServiceProviderName) },
      },
    });
  }

  public async getValuesByNamesOrThrow({
    programId,
    financialServiceProviderName,
    names,
  }: {
    programId: number;
    financialServiceProviderName: FinancialServiceProviderName;
    names: string[];
  }) {
    const configurations = await this.baseRepository.find({
      where: {
        programId: Equal(programId),
        fsp: { fsp: Equal(financialServiceProviderName) },
        name: In(names),
      },
    });
    for (const name of names) {
      if (
        !configurations.find((configuration) => configuration.name === name)
      ) {
        throw new Error(
          `Configuration with name ${name} not found for program ${programId} and FSP ${financialServiceProviderName}`,
        );
      }
    }

    return configurations.map((configuration) => ({
      name: configuration.name,
      value: configuration.value,
    }));
  }
}
