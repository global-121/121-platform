import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { InstanceReportingTransactionRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-transaction-raw.interface';
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

  public async getReferenceIdByTransactionIdOrThrow(
    transactionId: number,
  ): Promise<string> {
    const transaction = await this.findOne({
      where: { id: Equal(transactionId) },
      relations: { registration: true },
    });
    if (!transaction?.registration) {
      throw new Error(
        `Registration of transaction with id ${transactionId} not found`,
      );
    }
    return transaction.registration.referenceId;
  }

  public async countStartedTransactionsByReferenceId(
    referenceId: string,
  ): Promise<number> {
    // Started transactions are transactions that are not in 'pendingApproval' or 'approved' status
    // Only these transactions should be counted for payment count and completion of registration, as transactions in 'pendingApproval' or 'approved' status might still be deleted or rolled back
    // If a registrations would be in 2 payments at the same time (and 1 transaction away from completion) and the first payment is started the registration would move to completed
    // and than het would be exluded from the second payment, which is desired behavior (we expect this to rarely happen)
    return await this.createQueryBuilder('transaction')
      .leftJoin('transaction.registration', 'registration')
      .where('registration."referenceId" = :referenceId', { referenceId })
      .andWhere('transaction.status NOT IN (:...statuses)', {
        statuses: [
          TransactionStatusEnum.pendingApproval,
          TransactionStatusEnum.approved,
        ],
      })
      .getCount();
  }

  public async findForInstanceReporting(): Promise<
    InstanceReportingTransactionRaw[]
  > {
    return this.createQueryBuilder('transaction')
      .select([
        'transaction.id',
        'transaction.status',
        'transaction.transferValue',
        'transaction.created',
        'transaction.updated',
        'registration.id',
        'registration.referenceId',
        'program.id',
        'program.currency',
        'program.titlePortal',
      ])
      .innerJoin('transaction.registration', 'registration')
      .innerJoin('registration.program', 'program')
      .orderBy('program.id', 'ASC')
      .addOrderBy('transaction.created', 'ASC')
      .getMany();
  }
}
