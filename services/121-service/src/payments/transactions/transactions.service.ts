import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import chunk from 'lodash/chunk';
import { Equal, InsertResult, QueryRunner, Repository } from 'typeorm';

import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import { PaymentJobCreationDetails } from '@121-service/src/payments/interfaces/payment-job-creation-details.interface';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
@Injectable()
export class TransactionsService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly programRepository: ProgramRepository,
    private readonly registrationEventsService: RegistrationEventsService,
    private readonly transactionEventsService: TransactionEventsService,
  ) {}

  public async getLastTransactions({
    programId,
    paymentId,
    referenceId,
    status,
    programFspConfigId,
  }: {
    programId: number;
    paymentId?: number;
    referenceId?: string;
    status?: TransactionStatusEnum;
    programFspConfigId?: number;
  }): Promise<TransactionReturnDto[]> {
    return this.transactionScopedRepository
      .getLastTransactionsQuery({
        programId,
        paymentId,
        referenceId,
        status,
        programFspConfigId,
      })
      .getRawMany();
  }

  public async storeTransactionForStep2({
    transactionResponse,
    relationDetails,
  }: {
    transactionResponse: PaTransactionResultDto;
    relationDetails: TransactionRelationDetailsDto;
  }): Promise<void> {
    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(transactionResponse.referenceId) },
    });

    const transaction = new TransactionEntity();
    transaction.transferValue = transactionResponse.calculatedAmount;
    transaction.created = transactionResponse.date || new Date();
    transaction.registration = registration;
    transaction.programFspConfigurationId =
      relationDetails.programFspConfigurationId;
    transaction.paymentId = relationDetails.paymentId;
    transaction.userId = relationDetails.userId;
    transaction.status = transactionResponse.status;
    transaction.errorMessage = transactionResponse.message ?? null;
    transaction.customData = transactionResponse.customData;
    transaction.transactionStep = 2;

    const resultTransaction =
      await this.transactionScopedRepository.save(transaction);

    if (transactionResponse.messageSid) {
      await this.twilioMessageRepository.update(
        { sid: transactionResponse.messageSid },
        {
          transactionId: resultTransaction.id,
        },
      );
    }
    // Transaction step 2 does not need to update payment count or send notification
    // As transaction step 1 already did that
  }

  public async storeReconciliationTransactionsBulk(
    transactionResults: PaTransactionResultDto[],
    transactionRelationDetails: TransactionRelationDetailsDto,
  ): Promise<void> {
    // NOTE: this method is currently only used for the import-excel-reconciliation use case and assumes:
    // 1: only 1 program fsp id
    // 2: no notifications to send
    // 3: no payment count to update (as it is reconciliation of existing payment)
    // 4: no twilio message to relate to

    const transactionsToSave = await Promise.all(
      transactionResults.map(async (transactionResponse) => {
        // Get registrationId from referenceId if it is not defined
        // TODO find out when this is needed it seems to make more sense if the registrationId is always known and than refenceId is not needed
        if (!transactionResponse.registrationId) {
          const registration =
            await this.registrationScopedRepository.findOneOrFail({
              where: { referenceId: Equal(transactionResponse.referenceId) },
            });
          transactionResponse.registrationId = registration.id;
        }

        const transaction = new TransactionEntity();
        transaction.transferValue = transactionResponse.calculatedAmount;
        transaction.registrationId = transactionResponse.registrationId;
        transaction.programFspConfigurationId =
          transactionRelationDetails.programFspConfigurationId;
        transaction.paymentId = transactionRelationDetails.paymentId;
        transaction.userId = transactionRelationDetails.userId;
        transaction.status = transactionResponse.status;
        transaction.errorMessage = transactionResponse.message ?? null;
        transaction.customData = transactionResponse.customData;
        transaction.transactionStep = 1;
        // set other properties as needed
        return transaction;
      }),
    );

    const BATCH_SIZE = 2500;
    const transactionChunks = chunk(transactionsToSave, BATCH_SIZE);

    for (const chunkedTransactions of transactionChunks) {
      await this.transactionScopedRepository.save(chunkedTransactions);
    }
  }

  public async updateWaitingTransactionStep1(
    paymentId: number,
    registrationId: number,
    status: TransactionStatusEnum,
    messageSid?: string,
    errorMessage?: string,
  ): Promise<void> {
    const foundTransaction = await this.transactionScopedRepository.findOne({
      where: {
        paymentId: Equal(paymentId),
        registrationId: Equal(registrationId),
        transactionStep: Equal(1),
        status: Equal(TransactionStatusEnum.waiting),
      },
    });
    if (foundTransaction) {
      if (status === TransactionStatusEnum.waiting && messageSid) {
        await this.twilioMessageRepository.update(
          { sid: messageSid },
          {
            transactionId: foundTransaction.id,
          },
        );
      }
      if (status === TransactionStatusEnum.error) {
        foundTransaction.status = status;
        foundTransaction.errorMessage = errorMessage ?? null;
        await this.transactionScopedRepository.save(foundTransaction);
      }
    }
  }

  public async createTransactionAndUpdateRegistrationBulk({
    paymentJobCreationDetails,
    programId,
    paymentId,
    userId,
    isRetry,
  }: {
    paymentJobCreationDetails: PaymentJobCreationDetails[];
    programId: number;
    paymentId: number;
    userId: number;
    isRetry: boolean;
  }): Promise<Map<number, number>> {
    if (paymentJobCreationDetails.length === 0) {
      return new Map();
    }

    const queryRunner =
      this.transactionScopedRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const insertResult = await this.createTransactionsBulk({
        paymentJobCreationDetails,
        paymentId,
        userId,
        queryRunner,
      });

      const transactionIdByRegistrationId = new Map<number, number>();
      insertResult.raw.forEach(
        (row: { id: number; registrationId: number }) => {
          transactionIdByRegistrationId.set(row.registrationId, row.id);
        },
      );

      const eventsInput = paymentJobCreationDetails.map((i) => ({
        transactionId: transactionIdByRegistrationId.get(i.registrationId)!,
        userId,
        type: TransactionEventType.created,
        description: TransactionEventDescription.created,
        programFspConfigurationId: i.programFspConfigurationId,
      }));
      await this.transactionEventsService.createEventsBulk(
        eventsInput,
        queryRunner.manager,
      );

      if (!isRetry) {
        const updatedCounts = await this.updateAndGetPaymentCountBulk(
          paymentJobCreationDetails,
          queryRunner,
        );

        await this.setStatusToCompleteIfApplicableBulk({
          updatedCounts,
          programId,
          queryRunner,
        });
      }

      await queryRunner.commitTransaction();
      return new Map(Array.from(transactionIdByRegistrationId.entries()));
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  private async createTransactionsBulk({
    paymentJobCreationDetails,
    paymentId,
    userId,
    queryRunner,
  }: {
    paymentJobCreationDetails: PaymentJobCreationDetails[];
    paymentId: number;
    userId: number;
    queryRunner: QueryRunner;
  }): Promise<InsertResult> {
    const transactionValues = paymentJobCreationDetails.map((i) => ({
      transferValue: i.transactionAmount,
      registrationId: i.registrationId,
      paymentId,
      status: TransactionStatusEnum.created,
      userId,
    }));
    const insertResult = await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(TransactionEntity)
      .values(transactionValues)
      .returning(['id', 'registrationId'])
      .execute();
    return insertResult;
  }

  private async updateAndGetPaymentCountBulk(
    paymentJobCreationDetails: PaymentJobCreationDetails[],
    queryRunner: QueryRunner,
  ): Promise<
    {
      registrationId: number;
      newCount: number;
      maxPayments: number | null;
      currentStatus: RegistrationStatusEnum;
    }[]
  > {
    const registrationIds = [
      ...new Set(paymentJobCreationDetails.map((i) => i.registrationId)),
    ];
    const existingCountsRaw = await queryRunner.manager
      .createQueryBuilder()
      .select('r.id', 'registrationId')
      .addSelect('r."paymentCount"', 'paymentCount')
      .addSelect('r."registrationStatus"', 'registrationStatus')
      .addSelect('r."maxPayments"', 'maxPayments')
      .from('registration', 'r')
      .where('r.id IN (:...ids)', { ids: registrationIds })
      .getRawMany<{
        registrationId: number;
        paymentCount: number | null;
        registrationStatus: RegistrationStatusEnum;
        maxPayments: number | null;
      }>();

    const paymentCountIncrements = new Map<number, number>();
    for (const id of registrationIds) {
      paymentCountIncrements.set(id, (paymentCountIncrements.get(id) ?? 0) + 1);
    }

    const updatedCounts = existingCountsRaw.map((r) => {
      const increment = paymentCountIncrements.get(r.registrationId) ?? 0;
      const newCount = (r.paymentCount ?? 0) + increment;
      return {
        registrationId: r.registrationId,
        newCount,
        maxPayments: r.maxPayments,
        currentStatus: r.registrationStatus,
      };
    });

    const updatesNeedingCount = updatedCounts.filter(
      (u) =>
        u.newCount !==
        (existingCountsRaw.find((e) => e.registrationId === u.registrationId)
          ?.paymentCount ?? 0),
    );
    if (updatesNeedingCount.length > 0) {
      const ids: number[] = [];
      const caseFragments: string[] = [];
      for (const u of updatesNeedingCount) {
        ids.push(u.registrationId);
        caseFragments.push(`WHEN ${u.registrationId} THEN ${u.newCount}`);
      }
      const caseExpression = `CASE id ${caseFragments.join(' ')} ELSE "paymentCount" END`;

      // this is unscoped as desired
      await queryRunner.manager
        .createQueryBuilder()
        .update(RegistrationEntity)
        .set({
          paymentCount: () => caseExpression,
        })
        .whereInIds(ids)
        .execute();
    }
    return updatedCounts;
  }

  private async setStatusToCompleteIfApplicableBulk({
    updatedCounts,
    programId,
    queryRunner,
  }: {
    updatedCounts: {
      registrationId: number;
      newCount: number;
      maxPayments: number | null;
      currentStatus: RegistrationStatusEnum;
    }[];
    programId: number;
    queryRunner: QueryRunner;
  }): Promise<void> {
    const program = await this.programRepository.findByIdOrFail(programId);
    if (program.enableMaxPayments) {
      const newlyCompleted = updatedCounts.filter(
        (u) =>
          u.maxPayments !== null &&
          u.maxPayments !== undefined &&
          u.newCount >= (u.maxPayments ?? Infinity) &&
          u.currentStatus !== RegistrationStatusEnum.completed,
      );

      if (newlyCompleted.length > 0) {
        const completeIds = newlyCompleted.map((n) => n.registrationId);
        await queryRunner.manager
          .createQueryBuilder()
          .update('registration')
          .set({ registrationStatus: RegistrationStatusEnum.completed })
          .where('id IN (:...ids)', { ids: completeIds })
          .execute();

        for (const reg of newlyCompleted) {
          await this.registrationEventsService.createFromRegistrationViews(
            {
              id: reg.registrationId,
              status: updatedCounts.find(
                (e) => e.registrationId === reg.registrationId,
              )?.currentStatus,
            },
            {
              id: reg.registrationId,
              status: RegistrationStatusEnum.completed,
            },
            {
              explicitRegistrationPropertyNames: ['status'],
            },
          );
        }
      }
    }
  }
}
