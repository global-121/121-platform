import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';

import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { GetAuditedTransactionDto } from '@121-service/src/payments/transactions/dto/get-audited-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import {
  ScopedQueryBuilder,
  ScopedRepository,
} from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class TransactionScopedRepository extends ScopedRepository<TransactionEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(TransactionEntity)
    scopedRepository: ScopedRepository<TransactionEntity>,
  ) {
    super(request, scopedRepository);
  }

  async getManyByRegistrationIdAndProgramId(
    registrationId: number,
    programId: number,
  ) {
    const query = this.getLastTransactionsQuery({
      programId,
      registrationId,
    })
      .leftJoin('transaction.user', 'user')
      .addSelect('user.id', 'userId')
      .addSelect('user.username', 'username');
    return await query.getRawMany<GetAuditedTransactionDto>(); // ##TODO: Why not just return TwilioMessageEntity[]? And is this an example where we want to try a "normal" TypeORM query instead of a raw query?
  }

  // ##TODO: Since LatestTransactionEntity is another Entity, should it not also have its own custom repository?
  public getLastTransactionsQuery({
    programId,
    payment,
    registrationId,
    referenceId,
    status,
    fspName,
  }: {
    programId: number;
    payment?: number;
    registrationId?: number;
    referenceId?: string;
    status?: TransactionStatusEnum;
    fspName?: FinancialServiceProviderName;
  }): ScopedQueryBuilder<TransactionEntity> {
    let transactionQuery = this.createQueryBuilder('transaction')
      .select([
        'transaction.created AS "paymentDate"',
        'transaction.payment AS payment',
        'r."referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as "errorMessage"',
        'transaction.customData as "customData"',
        'fsp.displayName as "fspName"',
        'fsp.fsp as "fsp"',
        'fsp.integrationType as "fspIntegrationType"',
      ])
      .leftJoin('transaction.financialServiceProvider', 'fsp')
      .leftJoin('transaction.registration', 'r')
      // ##TODO: Why is latest transaction joined here, no where/select on it?
      .innerJoin('transaction.latestTransaction', 'lt')
      .andWhere('transaction."programId" = :programId', {
        programId,
      });
    if (payment) {
      transactionQuery = transactionQuery.andWhere(
        'transaction.payment = :payment',
        { payment },
      );
    }
    if (referenceId) {
      transactionQuery = transactionQuery.andWhere(
        'r."referenceId" = :referenceId',
        { referenceId },
      );
    }
    if (registrationId) {
      transactionQuery = transactionQuery.andWhere('r."id" = :registrationId', {
        registrationId,
      });
    }
    if (status) {
      transactionQuery = transactionQuery.andWhere(
        'transaction.status = :status',
        { status },
      );
    }
    if (fspName) {
      transactionQuery = transactionQuery.andWhere('fsp.fsp = :fspName', {
        fspName,
      });
    }
    return transactionQuery;
  }
}
