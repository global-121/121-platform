import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GetAuditedTransactionDto } from '@121-service/src/payments/transactions/dto/get-audited-transaction.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
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

  public async getTransactions({
    programId,
    paymentId,
    fromDate,
    toDate,
    fspSpecificJoinFields,
  }: {
    programId: number;
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
      registrationProgramId: number;
      registrationReferenceId: string;
      registrationId: number;
      status: TransactionStatusEnum;
      registrationStatus: RegistrationStatusEnum;
      amount: number;
      errorMessage: string | null;
      programFspConfigurationName: string;
    } & Record<string, unknown>)[]
  > {
    const query = this.createQueryBuilder('transaction')
      .select([
        'transaction.paymentId AS "paymentId"',
        'p.created AS "paymentDate"',
        'transaction.id AS "id"',
        'transaction.created AS "created"',
        'transaction.updated AS "updated"',
        'r."registrationProgramId"',
        'r."referenceId" as "registrationReferenceId"',
        'r."id" as "registrationId"',
        'r."registrationStatus"',
        'transaction.status AS "status"',
        'transaction."transferValue" AS "amount"',
        // 'transaction."errorMessage" as "errorMessage"', //##TODO: this was done at early stage to get to successful test
        // 'fspconfig.name as "programFspConfigurationName"', ##TODO: this was done at early stage to get to successful test
      ])
      // ##TODO: for now join latest event to get e.g. errorMessage. Re-evaluate this later.
      .leftJoin(
        (qb) =>
          qb
            .subQuery()
            .select([
              'DISTINCT ON (te."transactionId") te."transactionId" AS "transactionId"',
              'te."errorMessage" AS "errorMessage"',
              'te."created" AS "created"',
            ])
            .from(TransactionEventEntity, 'te')
            .orderBy('te."transactionId"', 'ASC')
            .addOrderBy('te."created"', 'DESC'),
        'lte',
        'lte."transactionId" = transaction.id',
      )
      .addSelect('lte."errorMessage" AS "errorMessage"')
      .leftJoin('transaction.registration', 'r')
      .leftJoin('transaction.payment', 'p')
      .andWhere('p."programId" = :programId', {
        programId,
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

  public async getPaymentCount(registrationId: number): Promise<number> {
    const distinctPayments = await this.createQueryBuilder('transaction')
      .select('DISTINCT transaction."paymentId"')
      .andWhere('transaction.registrationId = :registrationId', {
        registrationId,
      })
      .getRawMany();

    return distinctPayments.length;
  }

  // Make this private when all 'querying code' has been moved to this repository
  public getLastTransactionsQuery({
    programId,
    paymentId,
    registrationId,
    referenceId,
    status,
    programFspConfigId,
  }: {
    programId: number;
    paymentId?: number;
    registrationId?: number;
    referenceId?: string;
    status?: TransactionStatusEnum;
    programFspConfigId?: number;
  }): ScopedQueryBuilder<TransactionEntity> {
    let transactionQuery = this.createQueryBuilder('transaction')
      .select([
        'transaction.id AS "transactionId"',
        'transaction.created AS "paymentDate"',
        'transaction.updated AS updated',
        'transaction.paymentId AS "paymentId"',
        'r."referenceId"',
        'status',
        'transaction.transferValue AS "transferValue"',
        'lte."errorMessage" as "errorMessage"',
        'fspconfig.fspName as "fspName"',
        'lte."programFspConfigurationId" as "programFspConfigurationId"',
        'fspconfig.label as "programFspConfigurationLabel"',
        'fspconfig.name as "programFspConfigurationName"',
      ])
      // ##TODO: for now join latest event to get e.g. errorMessage/FSP. Re-evaluate this later.
      .leftJoin(
        (qb) =>
          qb
            .subQuery()
            .select([
              'DISTINCT ON (te."transactionId") te."transactionId" AS "transactionId"',
              'te."errorMessage" AS "errorMessage"',
              'te."programFspConfigurationId" AS "programFspConfigurationId"',
              'te."created" AS "created"',
            ])
            .from(TransactionEventEntity, 'te')
            .orderBy('te."transactionId"', 'ASC')
            .addOrderBy('te."created"', 'DESC'),
        'lte',
        'lte."transactionId" = transaction.id',
      )
      .leftJoin(
        ProgramFspConfigurationEntity,
        'fspconfig',
        'fspconfig.id = lte."programFspConfigurationId"',
      )
      .leftJoin('transaction.registration', 'r')
      .leftJoin('transaction.payment', 'p')
      .andWhere('p."programId" = :programId', {
        programId,
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
    if (programFspConfigId) {
      transactionQuery = transactionQuery.andWhere(
        'fspconfig.id = :programFspConfigId',
        {
          programFspConfigId,
        },
      );
    }
    return transactionQuery;
  }
}
