import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { InstanceReportingTransactionRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-transaction-raw.interface';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';

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

  public async getStatusByIdOrThrow(
    transactionId: number,
  ): Promise<TransactionStatusEnum> {
    const transaction = await this.findOne({
      where: { id: Equal(transactionId) },
      select: { status: true },
    });
    if (!transaction) {
      throw new Error(`Transaction with id ${transactionId} not found`);
    }
    return transaction.status as TransactionStatusEnum;
  }

  public async getWaitingTransactionIdsByFsp({
    fspName,
    limit,
  }: {
    fspName: Fsps;
    limit: number;
  }): Promise<number[]> {
    const transactions = await this.createQueryBuilder('transaction')
      .select('transaction.id', 'id')
      .innerJoin('transaction.lastTransactionEvent', 'lastTransactionEvent')
      .innerJoin('lastTransactionEvent.transactionEvent', 'transactionEvent')
      .innerJoin('transactionEvent.programFspConfiguration', 'fspConfig')
      .where('transaction.status = :status', {
        status: TransactionStatusEnum.waiting,
      })
      .andWhere('fspConfig.fspName = :fspName', { fspName })
      .orderBy('transaction.created', 'ASC')
      .limit(limit)
      .getRawMany();

    return transactions.map((transaction) => transaction.id);
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
    // Count only transactions that have progressed beyond 'pendingApproval' and
    // 'approved'. Those earlier states may still be deleted or rolled back, so
    // they should not contribute to payment counts or trigger registration
    // completion. This also ensures that if a registration is included in two
    // payments at once, starting the first payment can complete the registration
    // and exclude it from the second payment, which is the intended behavior.
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
        'startedEvent.id',
        'startedEvent.created',
        'registration.id',
        'registration.referenceId',
        'program.id',
        'program.currency',
        'program.titlePortal',
      ])
      .innerJoin('transaction.registration', 'registration')
      .innerJoin('registration.program', 'program')
      .leftJoin(
        'transaction.transactionEvents',
        'startedEvent',
        'startedEvent.description = :startedDescription',
        { startedDescription: TransactionEventDescription.initiated },
      )
      .orderBy('program.id', 'ASC')
      .addOrderBy('transaction.created', 'ASC')
      .addOrderBy('startedEvent.created', 'ASC')
      .getMany();
  }
}
