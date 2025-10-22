import { Inject, Injectable } from '@nestjs/common';

import { TransactionCreationDetails } from '@121-service/src/payments/interfaces/transaction-creation-details.interface';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
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
      transactionToSave.status = TransactionStatusEnum.created;
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
    await this.lastTransactionEventRepository.insert(
      lastTransactionEventsToSave,
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

  public async saveTransactionProgressBulk({
    newTransactionStatus,
    transactionIds,
    description,
    userId,
    programFspConfigurationId,
  }: {
    newTransactionStatus: TransactionStatusEnum;
    transactionIds: number[];
    description: TransactionEventDescription;
    userId: number;
    programFspConfigurationId: number;
  }): Promise<void> {
    await this.transactionScopedRepository.update(transactionIds, {
      status: newTransactionStatus,
    });
    const eventsAreSuccessful =
      newTransactionStatus !== TransactionStatusEnum.error;

    await this.transactionEventsService.createEventsBulk({
      transactionIds,
      programFspConfigurationId,
      userId,
      type: TransactionEventType.processingStep,
      description,
      isSuccessfullyCompleted: eventsAreSuccessful,
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
