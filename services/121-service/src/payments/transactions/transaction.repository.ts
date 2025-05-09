import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GetAuditedTransactionDto } from '@121-service/src/payments/transactions/dto/get-audited-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import {
  ScopedQueryBuilder,
  ScopedRepository,
} from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class TransactionScopedRepository extends ScopedRepository<TransactionEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(TransactionEntity)
    repository: Repository<TransactionEntity>,
  ) {
    super(request, repository);
  }

  async getLatestTransactionsByRegistrationIdAndProgramId(
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
    return await query.getRawMany<GetAuditedTransactionDto>(); // Leaving this as getRawMany for now, as it is not a plain entity. It's a concatenation of multiple entities.
  }

  public async getTransactionsForPayment({
    programId,
    payment,
  }: {
    programId: number;
    payment: number;
  }): Promise<
    {
      id: number;
      created: Date;
      updated: Date;
      payment: number;
      registrationProgramId: number;
      registrationReferenceId: string;
      registrationId: number;
      status: TransactionStatusEnum;
      registrationStatus: RegistrationStatusEnum;
      amount: number;
      errorMessage: string | null;
      programFinancialServiceProviderConfigurationName: string;
    }[]
  > {
    const query = this.createQueryBuilder('transaction')
      .select([
        'transaction.id AS "id"',
        'transaction.created AS "created"',
        'transaction.updated AS "updated"',
        'transaction.payment AS payment',
        'r."registrationProgramId"',
        'r."referenceId" as "registrationReferenceId"',
        'r."id" as "registrationId"',
        'r."registrationStatus"',
        'status',
        'amount',
        'transaction.errorMessage as "errorMessage"',
        'fspconfig.name as "programFinancialServiceProviderConfigurationName"',
      ])
      .leftJoin(
        'transaction.programFinancialServiceProviderConfiguration',
        'fspconfig',
      )
      .leftJoin('transaction.registration', 'r')
      .innerJoin('transaction.latestTransaction', 'lt')
      .andWhere('transaction."programId" = :programId', {
        programId,
      })
      .andWhere('transaction.payment = :payment', { payment });

    return query.getRawMany();
  }

  // Make this private when all 'querying code' has been moved to this repository
  public getLastTransactionsQuery({
    programId,
    payment,
    registrationId,
    referenceId,
    status,
    programFinancialServiceProviderConfigId,
  }: {
    programId: number;
    payment?: number;
    registrationId?: number;
    referenceId?: string;
    status?: TransactionStatusEnum;
    programFinancialServiceProviderConfigId?: number;
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
        'fspconfig.financialServiceProviderName as "financialServiceProviderName"',
        'transaction.programFinancialServiceProviderConfigurationId as "programFinancialServiceProviderConfigurationId"',
        'fspconfig.label as "programFinancialServiceProviderConfigurationLabel"',
        'fspconfig.name as "programFinancialServiceProviderConfigurationName"',
      ])
      .leftJoin(
        'transaction.programFinancialServiceProviderConfiguration',
        'fspconfig',
      )
      .leftJoin('transaction.registration', 'r')
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
    if (programFinancialServiceProviderConfigId) {
      transactionQuery = transactionQuery.andWhere(
        'fspconfig.id = :programFinancialServiceProviderConfigId',
        {
          programFinancialServiceProviderConfigId,
        },
      );
    }
    return transactionQuery;
  }
}
