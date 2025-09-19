import { Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
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
    private readonly transactionEventsService: TransactionEventsService,
  ) {}

  public async processOnafriqTransactionJob(
    transactionJob: OnafriqTransactionJobDto,
  ): Promise<void> {
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    // Create transaction event 'initiated' or 'retry'
    // ##TODO: this implies that on queue-retry you can have two events of type 'initiated'. Is this desirable?
    const transactionId =
      await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
        {
          registrationId: registration.id,
          transactionJob,
        },
      );

    // Create idempotency key
    const failedTransactionAttempts =
      await this.transactionEventsService.countFailedTransactionAttempts(
        transactionId,
      );
    // thirdPartyTransId is generated using: (referenceId + paymentId + failedTransactionAttempts)
    // Using this count to generate the thirdPartyTransId ensures that on:
    // a. Payment retry, a new thirdPartyTransId is generated, which will not be blocked by Onafriq API, as desired.
    // b. Queue retry: on queue retry, the same thirdPartyTransId is generated, which will be blocked by Onafriq API, as desired.
    const thirdPartyTransId = generateUUIDFromSeed(
      `ReferenceId=${transactionJob.referenceId},PaymentNumber=${transactionJob.paymentId},Attempt=${failedTransactionAttempts}`,
    );

    // Check for existing Onafriq Transaction with the same thirdPartyTransId ..
    let onafriqTransactionWithSameThirdPartyTransId =
      await this.onafriqTransactionScopedRepository.findOne({
        where: {
          thirdPartyTransId: Equal(thirdPartyTransId),
        },
      });

    if (!onafriqTransactionWithSameThirdPartyTransId) {
      // .. if not found (implies no queue-retry), check for existing Onafriq Transaction with the same transactionId (implies payment-retry) ..
      const onafriqTransactionWithSameTransactionId =
        await this.onafriqTransactionScopedRepository.findOne({
          where: {
            transactionId: Equal(transactionId),
          },
        });
      if (!onafriqTransactionWithSameTransactionId) {
        // .. if not found (implies: also no payment-retry), create new Onafriq Transaction
        const newOnafriqTransaction = new OnafriqTransactionEntity();
        newOnafriqTransaction.thirdPartyTransId = thirdPartyTransId;
        newOnafriqTransaction.recipientMsisdn =
          transactionJob.phoneNumberPayment;
        newOnafriqTransaction.transactionId = transactionId;
        onafriqTransactionWithSameThirdPartyTransId =
          await this.onafriqTransactionScopedRepository.save(
            newOnafriqTransaction,
          );
      } else {
        // .. if found (implies: payment-retry), update existing Onafriq Transaction with new thirdPartyTransId
        await this.onafriqTransactionScopedRepository.update(
          {
            id: onafriqTransactionWithSameTransactionId.id,
          },
          {
            thirdPartyTransId,
          },
        );
      }
    } else {
      // if found (implies: queue-retry), nothing needed here. Continue below with trying API-request with this existing thirdPartyTransId, which will be blocked by Onafriq API or not, depending on prior use.
    }

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
        await this.transactionJobsHelperService.createTransactionEventAndUpdateTransaction(
          {
            registrationId: registration.id,
            paymentId: transactionJob.paymentId,
            userId: transactionJob.userId, // ##TODO: maybe not fill userId from this stage anymore, as it's more the system picking it up? not so different from a callback coming in
            programFspConfigurationId: transactionJob.programFspConfigurationId,
            transactionEventType: TransactionEventType.paymentProgress,
            description: 'Onafriq transfer request failed',
            errorMessage: error.message,
            transactionStatus: TransactionStatusEnum.error,
          },
        );
        return;
      } else {
        throw error;
      }
    }

    // store success transactionEvent and update transaction to 'waiting'
    await this.transactionJobsHelperService.createTransactionEventAndUpdateTransaction(
      {
        registrationId: registration.id,
        paymentId: transactionJob.paymentId,
        userId: transactionJob.userId,
        programFspConfigurationId: transactionJob.programFspConfigurationId,
        transactionEventType: TransactionEventType.paymentProgress,
        description:
          'Onafriq transfer request successful, waiting for confirmation',
        transactionStatus: TransactionStatusEnum.waiting, // This will only go to 'success' via callback
      },
    );
  }
}
