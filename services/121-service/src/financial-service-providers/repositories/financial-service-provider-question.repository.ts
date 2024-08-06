import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

export class FinancialServiceProviderQuestionRepository extends Repository<FspQuestionEntity> {
  constructor(
    @InjectRepository(FspQuestionEntity)
    private baseRepository: Repository<FspQuestionEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }
  public async getQuestionsByFspName(
    fspName: FinancialServiceProviderName,
  ): Promise<FspQuestionEntity[]> {
    return await this.baseRepository.find({
      where: { fsp: { fsp: Equal(fspName) } },
    });
  }
}
