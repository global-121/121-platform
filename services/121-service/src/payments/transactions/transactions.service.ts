import { Inject, Injectable } from '@nestjs/common';
import chunk from 'lodash/chunk';

import { TransactionCreationDetails } from '@121-service/src/payments/interfaces/transaction-creation-details.interface';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { LastTransactionEventRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/last-transaction-event.repository';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
@Injectable()
export class TransactionsService {
  public constructor(
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly transactionEventsScopedRepository: TransactionEventsScopedRepository,
    private readonly transactionEventsService: TransactionEventsService,
    private readonly lastTransactionEventRepository: LastTransactionEventRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

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
      transactionToSave.transferValue = item.transferValue;
      transactionToSave.paymentId = paymentId;
      transactionToSave.status = TransactionStatusEnum.pendingApproval;
      transactionToSave.userId = userId;

      const transactionEvent = new TransactionEventEntity();
      transactionEvent.type = TransactionEventType.created;
      transactionEvent.description = TransactionEventDescription.created;
      transactionEvent.isSuccessfullyCompleted = true;
      transactionEvent.userId = userId;
      transactionEvent.programFspConfigurationId =
        item.programFspConfigurationId;
      transactionToSave.transactionEvents = [transactionEvent];

      transactionsToSave.push(transactionToSave);
    }

    const savedTransactions = await this.transactionScopedRepository.save(
      transactionsToSave,
      {
        chunk: 2000,
      },
    );

    const lastTransactionEventsToSave = savedTransactions.map(
      (transaction) => ({
        transactionId: transaction.id,
        transactionEventId: transaction.transactionEvents[0].id,
      }),
    );
    const chunkSize = 2000;
    for (const chunked of chunk(lastTransactionEventsToSave, chunkSize)) {
      await this.lastTransactionEventRepository.insert(chunked);
    }

    return savedTransactions.map((t) => t.id);
  }

  public async saveProgress({
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

  public async saveProgressBulk({
    newTransactionStatus,
    transactionIds,
    description,
    type,
    userId,
    programFspConfigurationId,
    errorMessages,
  }: {
    newTransactionStatus: TransactionStatusEnum;
    transactionIds: number[];
    description: TransactionEventDescription;
    type: TransactionEventType;
    userId: number;
    programFspConfigurationId: number;
    errorMessages?: Map<number, string>;
  }): Promise<void> {
    await this.transactionRepository.updateTransactionsToNewStatus(
      newTransactionStatus,
      transactionIds,
    );

    const eventsAreSuccessful =
      newTransactionStatus !== TransactionStatusEnum.error;

    await this.transactionEventsService.createEventsBulk({
      transactionIds,
      programFspConfigurationId,
      userId,
      type,
      description,
      isSuccessfullyCompleted: eventsAreSuccessful,
      errorMessages: errorMessages ?? undefined,
    });
  }

  public async updateTransactionStatus({
    transactionId,
    status,
  }: {
    transactionId: number;
    status: TransactionStatusEnum;
  }) {
    await this.transactionScopedRepository.update(transactionId, {
      status,
    });
  }

  // Used upon e.g. callbacks, but also upon intersolve-voucher incoming message
  public async saveProgressFromExternalSource({
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

    await this.saveProgress({
      context,
      description,
      errorMessage,
      newTransactionStatus,
    });
  }
}
