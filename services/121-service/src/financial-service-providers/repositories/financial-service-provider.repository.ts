import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

export class FinancialServiceProviderRepository extends Repository<FinancialServiceProviderEntity> {
  constructor(
    @InjectRepository(FinancialServiceProviderEntity)
    private baseRepository: Repository<FinancialServiceProviderEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }
  public async getByName(
    name: FinancialServiceProviderName,
  ): Promise<FinancialServiceProviderEntity | null> {
    return await this.baseRepository.findOne({
      where: { fsp: Equal(name) },
    });
  }
}
