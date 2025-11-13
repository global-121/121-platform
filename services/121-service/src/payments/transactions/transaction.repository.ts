import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

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

  public async updateTransactionsToNewStatus(
    newTransactionStatus: TransactionStatusEnum,
    transactionIds: number[],
  ): Promise<void> {
    await this.createQueryBuilder('transaction')
      .update()
      .set({ status: newTransactionStatus })
      .where('id = ANY(:ids)', { ids: transactionIds })
      .execute();
  }

  public async getPaymentCountByReferenceId(
    referenceId: string,
  ): Promise<number> {
    const result = await this.createQueryBuilder('transaction')
      .select('COUNT(DISTINCT transaction."paymentId")', 'paymentCount')
      .leftJoin('transaction.registration', 'registration')
      .where('registration."referenceId" = :referenceId', { referenceId })
      .getRawOne();
    if (!result) {
      return 0;
    }
    return result.paymentCount;
  }
}
