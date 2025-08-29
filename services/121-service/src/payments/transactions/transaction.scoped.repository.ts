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
import { EntityClass } from '@121-service/src/shared/types/entity-class.type';

export class TransactionScopedRepository extends ScopedRepository<TransactionEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(TransactionEntity)
    repository: Repository<TransactionEntity>,
  ) {
    super(request, repository);
  }

  async getLatestTransactionsByRegistrationIdAndProjectId(
    registrationId: number,
    projectId: number,
  ) {
    const query = this.getLastTransactionsQuery({
      projectId,
      registrationId,
    })
      .leftJoin('transaction.user', 'user')
      .addSelect('user.id', 'userId')
      .addSelect('user.username', 'username');
    return await query.getRawMany<GetAuditedTransactionDto>(); // Leaving this as getRawMany for now, as it is not a plain entity. It's a concatenation of multiple entities.
  }

  public async getTransactions({
    projectId,
    paymentId,
    fromDate,
    toDate,
    fspSpecificJoinFields,
  }: {
    projectId: number;
    paymentId?: number;
    fromDate?: Date;
    toDate?: Date;
    fspSpecificJoinFields?: {
      entityJoinedToTransaction: EntityClass<any>;
      attribute: string;
      alias: string;
    }[];
  }): Promise<
    ({
      paymentId: number;
      id: number;
      paymentDate: Date;
      created: Date;
      updated: Date;
      registrationProjectId: number;
      registrationReferenceId: string;
      registrationId: number;
      status: TransactionStatusEnum;
      registrationStatus: RegistrationStatusEnum;
      amount: number;
      errorMessage: string | null;
      projectFspConfigurationName: string;
    } & Record<string, unknown>)[]
  > {
    const query = this.createQueryBuilder('transaction')
      .select([
        'transaction.paymentId AS "paymentId"',
        'p.created AS "paymentDate"',
        'transaction.id AS "id"',
        'transaction.created AS "created"',
        'transaction.updated AS "updated"',
        'r."registrationProjectId"',
        'r."referenceId" as "registrationReferenceId"',
        'r."id" as "registrationId"',
        'r."registrationStatus"',
        'transaction.status AS "status"',
        'transaction.amount AS "amount"',
        'transaction.errorMessage as "errorMessage"',
        'fspconfig.name as "projectFspConfigurationName"',
      ])
      .leftJoin('transaction.projectFspConfiguration', 'fspconfig')
      .leftJoin('transaction.registration', 'r')
      .leftJoin('transaction.payment', 'p')
      .innerJoin('transaction.latestTransaction', 'lt')
      .andWhere('p."projectId" = :projectId', {
        projectId,
      });

    if (paymentId !== undefined && paymentId !== null) {
      query.andWhere('transaction.paymentId = :paymentId', { paymentId });
    }
    if (fromDate) {
      query.andWhere('p.created >= :fromDate', { fromDate });
    }
    if (toDate) {
      query.andWhere('p.created <= :toDate', { toDate });
    }

    if (!fspSpecificJoinFields) {
      return query.getRawMany();
    }

    for (const field of fspSpecificJoinFields) {
      const joinTableAlias = `joinTable${field.entityJoinedToTransaction.name}${field.attribute}`;
      query.leftJoin(
        field.entityJoinedToTransaction,
        joinTableAlias,
        `transaction.id = ${joinTableAlias}.transactionId`,
      );
      query.addSelect(
        `"${joinTableAlias}"."${field.attribute}" as "${field.alias}"`,
      );
    }

    return query.getRawMany();
  }

  // Make this private when all 'querying code' has been moved to this repository
  public getLastTransactionsQuery({
    projectId,
    paymentId,
    registrationId,
    referenceId,
    status,
    projectFspConfigId,
  }: {
    projectId: number;
    paymentId?: number;
    registrationId?: number;
    referenceId?: string;
    status?: TransactionStatusEnum;
    projectFspConfigId?: number;
  }): ScopedQueryBuilder<TransactionEntity> {
    let transactionQuery = this.createQueryBuilder('transaction')
      .select([
        'transaction.created AS "paymentDate"',
        'transaction.updated AS updated',
        'transaction.paymentId AS "paymentId"',
        'r."referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as "errorMessage"',
        'transaction.customData as "customData"',
        'fspconfig.fspName as "fspName"',
        'transaction.projectFspConfigurationId as "projectFspConfigurationId"',
        'fspconfig.label as "projectFspConfigurationLabel"',
        'fspconfig.name as "projectFspConfigurationName"',
      ])
      .leftJoin('transaction.projectFspConfiguration', 'fspconfig')
      .leftJoin('transaction.registration', 'r')
      .leftJoin('transaction.payment', 'p')
      .innerJoin('transaction.latestTransaction', 'lt')
      .andWhere('p."projectId" = :projectId', {
        projectId,
      });
    if (paymentId) {
      transactionQuery = transactionQuery.andWhere(
        'transaction.paymentId = :paymentId',
        { paymentId },
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
    if (projectFspConfigId) {
      transactionQuery = transactionQuery.andWhere(
        'fspconfig.id = :projectFspConfigId',
        {
          projectFspConfigId,
        },
      );
    }
    return transactionQuery;
  }
}
