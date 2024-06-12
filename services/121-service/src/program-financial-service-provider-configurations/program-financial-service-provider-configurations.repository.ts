import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

export class ProgramFinancialServiceProviderConfigurationsRepository extends Repository<ProgramFinancialServiceProviderConfigurationEntity> {
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
}
