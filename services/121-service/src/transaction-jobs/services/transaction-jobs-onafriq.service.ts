import { Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/transaction-events.scoped.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

@Injectable()
export class TransactionJobsOnafriqService {
  constructor(
    private readonly onafriqService: OnafriqService,
    @Inject(getScopedRepositoryProviderName(OnafriqTransactionEntity))
    private readonly onafriqTransactionScopedRepository: ScopedRepository<OnafriqTransactionEntity>,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
  ) {}

  public async processOnafriqTransactionJob(
    transactionJob: OnafriqTransactionJobDto,
  ): Promise<void> {
    // 1. Create transaction event 'initiated' or 'retry'
    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      transactionJob,
    );

    // 2. Create idempotency key
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );
    // thirdPartyTransId is generated using: (referenceId + transactionId + failedTransactionAttempts)
    // Using this count to generate the thirdPartyTransId ensures that on:
    // a. Payment retry, a new thirdPartyTransId is generated, which will not be blocked by Onafriq API, as desired.
    // b. Queue retry: on queue retry, the same thirdPartyTransId is generated, which will be blocked by Onafriq API, as desired.
    const thirdPartyTransId = generateUUIDFromSeed(
      `ReferenceId=${transactionJob.referenceId},TransactionId=${transactionJob.transactionId},Attempt=${failedTransactionAttempts}`,
    );

    // 3. Create or update Onafriq Transaction with thirdPartyTransId
    await this.createOrUpdateOnafriqTransactionIfNeeded(
      thirdPartyTransId,
      transactionJob,
    );

    // 4. Start the transfer, if failure: update to error transaction and return early
    try {
      await this.onafriqService.createTransaction({
        transferAmount: transactionJob.transactionAmount,
        phoneNumberPayment: transactionJob.phoneNumberPayment,
        firstName: transactionJob.firstName,
        lastName: transactionJob.lastName,
        thirdPartyTransId,
      });
    } catch (error) {
      if (
        error instanceof OnafriqError &&
        error.type ===
          OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError
      ) {
        // Return early, as this job re-attempt has already been processed before, which should not be overwritten
        console.error(error.message);
        return;
      } else if (error instanceof OnafriqError) {
        // store error transactionEvent and update transaction to 'error'
        await this.transactionJobsHelperService.createTransactionEvent({
          transactionJob,
          transactionEventType: TransactionEventType.processingStep,
          description: TransactionEventDescription.onafriqRequestSent,
          errorMessage: error.message,
        });
        await this.transactionJobsHelperService.updateTransactionStatus(
          transactionJob.transactionId,
          TransactionStatusEnum.error,
        );
        return;
      } else {
        throw error;
      }
    }

    // 5. store success transactionEvent and update transaction to 'waiting'
    await this.transactionJobsHelperService.createTransactionEvent({
      transactionJob,
      transactionEventType: TransactionEventType.processingStep,
      description: TransactionEventDescription.onafriqRequestSent,
    });
    await this.transactionJobsHelperService.updateTransactionStatus(
      transactionJob.transactionId,
      TransactionStatusEnum.waiting, // This will only go to 'success' via callback
    );
  }

  private async createOrUpdateOnafriqTransactionIfNeeded(
    thirdPartyTransId: string,
    transactionJob: OnafriqTransactionJobDto,
  ): Promise<void> {
    const onafriqTransactionWithSameThirdPartyTransId =
      await this.onafriqTransactionScopedRepository.findOne({
        where: {
          thirdPartyTransId: Equal(thirdPartyTransId),
        },
      });

    // if found (implies: queue-retry), no action needed. Continue with trying API-request with existing thirdPartyTransId, which will be blocked by Onafriq API or not, depending on prior use.
    if (onafriqTransactionWithSameThirdPartyTransId) {
      return;
    }

    // .. if not found: check for existing Onafriq Transaction with the same transactionId ..
    const onafriqTransactionWithSameTransactionId =
      await this.onafriqTransactionScopedRepository.findOne({
        where: {
          transactionId: Equal(transactionJob.transactionId),
        },
      });

    // .. if found (implies: payment-retry), update existing Onafriq Transaction with new thirdPartyTransId
    if (onafriqTransactionWithSameTransactionId) {
      await this.onafriqTransactionScopedRepository.update(
        {
          id: onafriqTransactionWithSameTransactionId.id,
        },
        {
          thirdPartyTransId,
        },
      );
      return;
    }

    // .. if not found (implies: also nor queue-retry nor payment-retry), create new Onafriq Transaction
    const newOnafriqTransaction = new OnafriqTransactionEntity();
    newOnafriqTransaction.thirdPartyTransId = thirdPartyTransId;
    newOnafriqTransaction.recipientMsisdn = transactionJob.phoneNumberPayment;
    newOnafriqTransaction.transactionId = transactionJob.transactionId;
    await this.onafriqTransactionScopedRepository.save(newOnafriqTransaction);
  }
}
