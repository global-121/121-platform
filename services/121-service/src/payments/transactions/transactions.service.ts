import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import chunk from 'lodash/chunk';
import { Equal, Repository } from 'typeorm';

import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProcessTransactionResultInput } from '@121-service/src/payments/transactions/interfaces/process-transaction-result-input.interface';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
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
        // TODO find out when this is needed it seems to make more sense if the registrationId is always known and than referenceId is not needed
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

  public async createTransactionAndUpdateRegistration({
    registration,
    transactionJob,
    transferAmountInMajorUnit: calculatedTransferAmountInMajorUnit,
  }: ProcessTransactionResultInput): Promise<TransactionEntity> {
    const { programFspConfigurationId, programId, paymentId, userId, isRetry } =
      transactionJob;

    const resultTransaction = await this.createTransaction({
      amount: calculatedTransferAmountInMajorUnit,
      registration,
      paymentId,
    });

    await this.transactionEventsService.createEvent({
      transactionId: resultTransaction.id,
      userId,
      type: TransactionEventType.created,
      programFspConfigurationId,
    });

    if (!isRetry) {
      const paymentCount = await this.updateAndGetPaymentCount(registration.id);
      const currentStatusIsCompleted =
        await this.setStatusToCompleteIfApplicable({
          registration,
          programId,
          paymentCount,
        });

      // Added this check to avoid a bit of processing time if the status is the same
      if (currentStatusIsCompleted) {
        await this.registrationEventsService.createFromRegistrationViews(
          {
            id: registration.id,
            status: registration.registrationStatus ?? undefined,
          },
          {
            id: registration.id,
            status: RegistrationStatusEnum.completed,
          },
          {
            explicitRegistrationPropertyNames: ['status'],
          },
        );
      }
    }

    return resultTransaction;
  }

  private async createTransaction({
    amount, // transaction entity are always in major unit
    registration,
    paymentId,
  }: {
    amount: number;
    registration: RegistrationEntity;
    paymentId: number;
  }) {
    const transaction = new TransactionEntity();
    transaction.transferValue = amount;
    transaction.created = new Date();
    transaction.registration = registration;
    transaction.paymentId = paymentId;
    transaction.status = TransactionStatusEnum.created;

    return await this.transactionScopedRepository.save(transaction);
  }

  private async updateAndGetPaymentCount(
    registrationId: number,
  ): Promise<number> {
    const paymentCount =
      await this.transactionScopedRepository.getPaymentCount(registrationId);

    await this.registrationScopedRepository.updateUnscoped(registrationId, {
      paymentCount,
    });
    return paymentCount;
  }

  private async setStatusToCompleteIfApplicable({
    registration,
    programId,
    paymentCount,
  }: {
    registration: RegistrationEntity;
    programId: number;
    paymentCount: number;
  }): Promise<boolean> {
    const program = await this.programRepository.findByIdOrFail(programId);

    if (!program.enableMaxPayments) {
      return false;
    }

    // registration.maxPayments can only be a positive integer or null
    // This situation will only occur when enableMaxPayments is turned on after
    // the registration was created.
    if (
      registration.maxPayments === null ||
      registration.maxPayments === undefined
    ) {
      return false;
    }

    if (paymentCount < registration.maxPayments) {
      return false;
    }

    await this.registrationScopedRepository.updateUnscoped(registration.id, {
      registrationStatus: RegistrationStatusEnum.completed,
    });

    return true;
  }
}
