import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { SafaricomTransferEntity } from '@121-service/src/fsp-integrations/integrations/safaricom/entities/safaricom-transfer.entity';
import { DuplicateOriginatorConversationIdError } from '@121-service/src/fsp-integrations/integrations/safaricom/errors/duplicate-originator-conversation-id.error';
import { SafaricomApiError } from '@121-service/src/fsp-integrations/integrations/safaricom/errors/safaricom-api.error';
import { SafaricomTransferScopedRepository } from '@121-service/src/fsp-integrations/integrations/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/fsp-integrations/integrations/safaricom/safaricom.service';
import { SaveTransactionProgressAndUpdateRegistrationContext } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/save-transaction-progress-and-update-registration-context.interface';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { SafaricomTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

@Injectable()
export class TransactionJobsSafaricomService {
  constructor(
    private readonly safaricomService: SafaricomService,
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
  ) {}

  public async processSafaricomTransactionJob(
    transactionJob: SafaricomTransactionJobDto,
  ): Promise<void> {
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };

    // 1. Create transaction event 'initiated' or 'retry'
    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      { context: transactionEventContext, isRetry: transactionJob.isRetry },
    );

    // 2. Create idempotency key
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );
    // originatorConversationId is generated using: (referenceId + transactionId + failedTransactionAttempts)
    // Using this count to generate the originatorConversationId ensures that on:
    // a. Payment retry, a new originatorConversationId is generated, which will not be blocked by Onafriq API, as desired.
    // b. Queue retry: on queue retry, the same originatorConversationId is generated, which will be blocked by Onafriq API, as desired.
    const originatorConversationId = generateUUIDFromSeed(
      `ReferenceId=${transactionJob.referenceId},TransactionId=${transactionJob.transactionId},Attempt=${failedTransactionAttempts}`,
    );

    // 3. Create or update Safaricom Transfer with originatorConversationId
    await this.upsertSafaricomTransfer(
      originatorConversationId,
      transactionJob,
    );

    // 4. Start the transfer, if failure update to error transaction and return early
    const saveTransactionProgressAndUpdateRegistrationContext: SaveTransactionProgressAndUpdateRegistrationContext =
      {
        transactionEventContext,
        referenceId: transactionJob.referenceId,
        isRetry: transactionJob.isRetry,
      };
    try {
      await this.safaricomService.doTransfer({
        transferValue: transactionJob.transferValue,
        phoneNumber: transactionJob.phoneNumber!,
        idNumber: transactionJob.idNumber!,
        originatorConversationId,
      });
    } catch (error) {
      if (error instanceof DuplicateOriginatorConversationIdError) {
        // Return early, as this job re-attempt has already been processed before, which should not be overwritten
        console.error(error.message);
        return;
      } else if (error instanceof SafaricomApiError) {
        // store error transactionEvent and update transaction to 'error'
        await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
          {
            context: saveTransactionProgressAndUpdateRegistrationContext,
            description: TransactionEventDescription.safaricomRequestSent,
            errorMessage: error.message,
            newTransactionStatus: TransactionStatusEnum.error,
          },
        );
        return;
      } else {
        throw error;
      }
    }

    // 5. store success transactionEvent and update transaction to 'waiting'
    await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
      {
        context: saveTransactionProgressAndUpdateRegistrationContext,
        description: TransactionEventDescription.safaricomRequestSent,
        newTransactionStatus: TransactionStatusEnum.waiting,
      },
    );
  }

  private async upsertSafaricomTransfer(
    originatorConversationId: string,
    transactionJob: SafaricomTransactionJobDto,
  ): Promise<void> {
    // Check for existing Safaricom Transactions with the same transactionId
    const safaricomTransferWithSameTransactionId =
      await this.safaricomTransferScopedRepository.findOne({
        where: {
          transactionId: Equal(transactionJob.transactionId),
        },
      });

    // .. if found (implies: payment-retry or queue-retry), update existing Safaricom Transfer with originatorConversationId. In case of queue-retry the originatorConversationId is the same, so the update is not needed. But this leads to easier code.
    if (safaricomTransferWithSameTransactionId) {
      await this.safaricomTransferScopedRepository.update(
        {
          id: safaricomTransferWithSameTransactionId.id,
        },
        {
          originatorConversationId,
        },
      );
      return;
    }

    // .. if not found, create new Safaricom Transfer
    const newSafaricomTransfer = new SafaricomTransferEntity();
    newSafaricomTransfer.originatorConversationId = originatorConversationId;
    newSafaricomTransfer.transactionId = transactionJob.transactionId;
    await this.safaricomTransferScopedRepository.save(newSafaricomTransfer);
  }
}
