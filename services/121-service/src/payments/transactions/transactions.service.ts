import { Injectable } from '@nestjs/common';
import chunk from 'lodash/chunk';
import { Equal } from 'typeorm';

import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import { TransactionCreationDetails } from '@121-service/src/payments/interfaces/transaction-creation-details.interface';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/transaction-events.scoped.repository';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
@Injectable()
export class TransactionsService {
  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionEventsScopedRepository: TransactionEventsScopedRepository,
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

  public async createTransactionsAndEvents({
    transactionCreationDetails,
    paymentId,
    userId,
  }: {
    transactionCreationDetails: TransactionCreationDetails[];
    paymentId: number;
    userId: number;
  }): Promise<number[]> {
    const transactionsToSave: TransactionEntity[] = [];
    for (const item of transactionCreationDetails) {
      const transactionToSave = new TransactionEntity();
      transactionToSave.registrationId = item.registrationId;
      transactionToSave.transferValue = item.transactionAmount;
      transactionToSave.paymentId = paymentId;
      transactionToSave.status = TransactionStatusEnum.created;
      transactionToSave.userId = userId;
      transactionsToSave.push(transactionToSave);
    }

    for (const transaction of transactionsToSave) {
      const transactionEvent = new TransactionEventEntity();
      transactionEvent.type = TransactionEventType.created;
      transactionEvent.description = TransactionEventDescription.created;
      transactionEvent.isSuccessfullyCompleted = true;
      transactionEvent.userId = userId;
      transaction.transactionEvents = [transactionEvent];
    }

    const savedTransactions = await this.transactionScopedRepository.save(
      transactionsToSave,
      {
        chunk: 2000,
      },
    );

    return savedTransactions.map((t) => t.id);
  }

  public async saveTransactionProgress({
    context,
    description,
    errorMessage,
    newTransactionStatus,
  }: {
    context: TransactionEventCreationContext;
    description: TransactionEventDescription;
    errorMessage?: string;
    newTransactionStatus?: TransactionStatusEnum;
  }) {
    const transactionEventType = TransactionEventType.processingStep;
    await this.transactionEventsService.createEvent({
      context,
      type: transactionEventType,
      description,
      errorMessage,
    });

    if (newTransactionStatus) {
      await this.updateTransactionStatus({
        transactionId: context.transactionId,
        status: newTransactionStatus,
      });
    }
  }

  public async updateTransactionStatus({
    transactionId,
    status,
  }: {
    transactionId: number;
    status: TransactionStatusEnum;
  }) {
    await this.transactionScopedRepository.update(transactionId, { status });
  }

  // Used upon e.g. callbacks, but also upon intersolve-voucher incoming message
  public async saveTransactionProgressFromExternalSource({
    transactionId,
    description,
    errorMessage,
    newTransactionStatus,
  }: {
    transactionId: number;
    description: TransactionEventDescription;
    errorMessage?: string;
    newTransactionStatus?: TransactionStatusEnum;
  }) {
    // In these cases programFspConfigurationId is not directly known, so inferred from latest event before this one
    const latestEvent =
      await this.transactionEventsScopedRepository.findLatestEventByTransactionId(
        transactionId,
      );
    const context: TransactionEventCreationContext = {
      transactionId,
      userId: null,
      programFspConfigurationId: latestEvent.programFspConfigurationId,
    };

    await this.saveTransactionProgress({
      context,
      description,
      errorMessage,
      newTransactionStatus,
    });
  }
}
