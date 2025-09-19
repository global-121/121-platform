import { Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
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
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  public async processOnafriqTransactionJob(
    transactionJob: OnafriqTransactionJobDto,
  ): Promise<void> {
    // 1. Create idempotency key
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );
    // ##TODO should change to count of transaction events of type 'initiated'?
    const failedTransactionsCount =
      await this.transactionScopedRepository.count({
        where: {
          registrationId: Equal(registration.id),
          paymentId: Equal(transactionJob.paymentId),
          status: Equal(TransactionStatusEnum.error),
        },
      });
    // thirdPartyTransId is generated using: (referenceId + paymentId + failedTransactionsCount)
    // Using this count to generate the thirdPartyTransId ensures that on:
    // a. Payment retry, a new thirdPartyTransId is generated, which will not be blocked by Onafriq API, as desired.
    // b. Queue retry: on queue retry, the same thirdPartyTransId is generated, which will be blocked by Onafriq API, as desired.
    const thirdPartyTransId = generateUUIDFromSeed(
      `ReferenceId=${transactionJob.referenceId},PaymentNumber=${transactionJob.paymentId},Attempt=${failedTransactionsCount}`,
    );

    // 2. Check for existing Onafriq Transaction with the same thirdPartyTransId, because that means this job has already been (partly) processed. In case of a server crash, jobs that were in process are processed again.
    let onafriqTransaction =
      await this.onafriqTransactionScopedRepository.findOne({
        where: {
          thirdPartyTransId: Equal(thirdPartyTransId),
        },
      });

    // 3. if no onafriq transaction yet, update 121 transaction and create transaction event, otherwise this has already happened before
    let transactionId: number;
    // ##TODO: this if is no longer the correct condition, as ...
    if (!onafriqTransaction) {
      const transaction =
        await this.transactionJobsHelperService.createTransactionEventAndUpdateTransaction(
          {
            registrationId: registration.id,
            paymentId: transactionJob.paymentId,
            userId: transactionJob.userId,
            programFspConfigurationId: transactionJob.programFspConfigurationId,
            transactionStatus: TransactionStatusEnum.waiting, // This will only go to 'success' via callback
            transactionEventType: TransactionEventType.initiated,
          },
        );
      transactionId = transaction.id;

      // TODO: combine this with the transaction creation above in one SQL transaction
      // ##TODO: on retry we should update existing onafriq-transaction-entity instead of creating new one
      const newOnafriqTransaction = new OnafriqTransactionEntity();
      newOnafriqTransaction.thirdPartyTransId = thirdPartyTransId;
      newOnafriqTransaction.recipientMsisdn = transactionJob.phoneNumberPayment;
      newOnafriqTransaction.transactionId = transactionId;
      onafriqTransaction = await this.onafriqTransactionScopedRepository.save(
        newOnafriqTransaction,
      );
    } else {
      transactionId = onafriqTransaction.transactionId;
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
        await this.transactionScopedRepository.update(
          { id: transactionId },
          { status: TransactionStatusEnum.error },
        );
        return;
      } else {
        throw error;
      }
    }

    // 5. No messages sent for onafriq

    // 6. No 121 transaction stored or updated after API-call, because waiting transaction is already stored earlier and will remain 'waiting' at this stage (to be updated via callback)
  }
}
