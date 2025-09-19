import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';

export class TransactionRepository extends Repository<TransactionEntity> {
  constructor(
    @InjectRepository(TransactionEntity)
    private baseRepository: Repository<TransactionEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getLastThreePaymentIdsForRegistration(
    registrationId: number,
  ): Promise<number[]> {
    const lastThreePaymentIds = await this.baseRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction."paymentId"', 'paymentId')
      .addSelect('MAX(payment.created)', 'maxCreated')
      .leftJoin('transaction.payment', 'payment')
      .where('transaction.registrationId = :registrationId', { registrationId })
      .groupBy('transaction."paymentId"')
      .orderBy('"maxCreated"', 'DESC')
      .limit(3)
      .getRawMany();

    return lastThreePaymentIds.map((payment) => payment.paymentId);
  }
}
