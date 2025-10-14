import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionViewEntity } from '@121-service/src/payments/transactions/entities/transaction-view.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { EntityClass } from '@121-service/src/shared/types/entity-class.type';

export class TransactionViewScopedRepository extends ScopedRepository<TransactionViewEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(TransactionViewEntity)
    repository: Repository<TransactionViewEntity>,
  ) {
    super(request, repository);
  }

  public async getAuditedTransactionViews({
    registrationId,
    programId,
  }: {
    registrationId: number;
    programId: number;
  }) {
    return await this.find({
      where: {
        registration: {
          id: Equal(registrationId),
          programId: Equal(programId),
        },
      },
      order: { created: 'DESC' },
      select: {
        id: true,
        paymentId: true,
        status: true,
        transferValue: true,
        errorMessage: true,
        programFspConfigurationName: true,
        programFspConfigurationLabel: {}, // for some reason using true here gave a type error
        fspName: true,
        created: true,
        updated: true,
        user: {
          id: true,
          username: true,
        },
      },
      relations: {
        user: true,
      },
    });
  }

  public async getFailedTransactionDetailsForRetry({
    programId,
    paymentId,
  }: {
    programId: number;
    paymentId: number;
  }): Promise<
    {
      id: number;
      registrationReferenceId: string;
      programFspConfigurationName: string;
    }[]
  > {
    return await this.createQueryBuilder('transaction')
      .addSelect('transaction.id', 'id')
      .addSelect('registration.referenceId', 'registrationReferenceId')
      .addSelect('programFspConfiguration.name', 'programFspConfigurationName')
      .leftJoin('transaction.registration', 'registration')
      .leftJoin(
        'registration.programFspConfiguration',
        'programFspConfiguration', // Selecting the FSP configuration assigned to the registration at the time of retry not of the last transaction event
      )
      .andWhere('transaction.paymentId = :paymentId', { paymentId })
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('transaction.status = :status', {
        status: TransactionStatusEnum.error,
      })
      .getRawMany();
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
        'r.registrationProgramId AS "registrationProgramId"',
        'r.referenceId AS "registrationReferenceId"',
        'r.id AS "registrationId"',
        'r.registrationStatus AS "registrationStatus"',
        'transaction.status AS "status"',
        'transaction.transferValue AS "amount"',
        'transaction.errorMessage AS "errorMessage"',
        'transaction.programFspConfigurationName AS "programFspConfigurationName"',
      ])
      .leftJoin('transaction.registration', 'r')
      .leftJoin('transaction.payment', 'p')
      .andWhere('p.programId = :programId', {
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

  public async getTransactionJobCreationDetails(
    transactionIds: number[],
  ): Promise<
    {
      transactionId: number;
      transferValue: number;
      referenceId: string;
      fspName: Fsps;
    }[]
  > {
    return await this.createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.registration', 'registration')
      .innerJoinAndSelect('registration.programFspConfiguration', 'fspConfig')
      .andWhere('transaction.id IN (:...transactionIds)', { transactionIds })
      .select([
        'transaction.id as "transactionId"',
        'transaction.transferValue as "transferValue"',
        'registration."referenceId" as "referenceId"',
        '"fspConfig"."fspName" as "fspName"', // Uses the current FSP assigned to the registration instead of the one assigned to the last transaction event
      ])
      .getRawMany<{
        transactionId: number;
        transferValue: number;
        referenceId: string;
        fspName: Fsps;
      }>();
  }

  public async getPaymentIdByTransactionId(
    transactionId: number,
  ): Promise<number> {
    const transaction = await this.findOneOrFail({
      where: { id: Equal(transactionId) },
      select: { paymentId: true },
    });
    return transaction.paymentId;
  }

  public async getTransactionIdByPaymentAndRegistration(
    paymentId: number,
    registrationId: number,
  ): Promise<number> {
    const transaction = await this.findOneOrFail({
      where: {
        paymentId: Equal(paymentId),
        registration: { id: Equal(registrationId) },
      },
      select: { id: true },
    });
    return transaction.id;
  }

  public async aggregateTransactionsByStatus({
    programId,
    paymentId,
  }: {
    programId: number;
    paymentId: number;
  }): Promise<
    {
      status: TransactionStatusEnum;
      count: string;
      totalamount: string;
    }[]
  > {
    return await this.createQueryBuilder('transaction')
      .select('transaction.status', 'status')
      .leftJoin('transaction.payment', 'p')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'SUM(ROUND(transaction."transferValue"::numeric, 2))',
        'totalamount',
      )
      .andWhere('p."programId" = :programId', {
        programId,
      })
      .andWhere('transaction."paymentId" = :paymentId', {
        paymentId,
      })
      .groupBy('transaction.status')
      .getRawMany();
  }
}
