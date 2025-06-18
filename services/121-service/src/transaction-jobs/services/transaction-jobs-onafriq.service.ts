import { Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

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
    // 1. Check for existing Onafriq Transaction with the same thirdPartyTransId, because that means this job has already been (partly) processed. In case of a server crash, jobs that were in process are processed again.
    let onafriqTransaction =
      await this.onafriqTransactionScopedRepository.findOne({
        where: {
          thirdPartyTransId: Equal(transactionJob.thirdPartyTransId),
        },
      });

    // 2. if no onafriq transaction yet, create a 121 transaction, otherwise this has already happened before
    let transactionId: number;
    if (!onafriqTransaction) {
      const registration =
        await this.transactionJobsHelperService.getRegistrationOrThrow(
          transactionJob.referenceId,
        );
      const oldRegistration = structuredClone(registration);
      const transaction =
        await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
          {
            programId: transactionJob.programId,
            paymentNumber: transactionJob.paymentNumber,
            userId: transactionJob.userId,
            transferAmountInMajorUnit: transactionJob.transactionAmount,
            programFspConfigurationId: transactionJob.programFspConfigurationId,
            registration,
            oldRegistration,
            isRetry: transactionJob.isRetry,
            status: TransactionStatusEnum.waiting, // This will only go to 'success' via callback
          },
        );
      transactionId = transaction.id;

      // TODO: combine this with the transaction creation above in one SQL transaction
      const newOnafriqTransaction = new OnafriqTransactionEntity();
      newOnafriqTransaction.thirdPartyTransId =
        transactionJob.thirdPartyTransId;
      newOnafriqTransaction.transactionId = transactionId;
      onafriqTransaction = await this.onafriqTransactionScopedRepository.save(
        newOnafriqTransaction,
      );
    } else {
      transactionId = onafriqTransaction.transactionId;
    }

    // 3. Start the transfer, if failure: update to error transaction and return early
    try {
      await this.onafriqService.createTransaction({
        transferAmount: transactionJob.transactionAmount,
        phoneNumber: transactionJob.phoneNumber!,
        firstName: transactionJob.firstName!,
        lastName: transactionJob.lastName!,
        thirdPartyTransId: transactionJob.thirdPartyTransId!,
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
          { status: TransactionStatusEnum.error, errorMessage: error?.message },
        );
        return;
      } else {
        throw error;
      }
    }

    // 4. No messages sent for onafriq

    // 5. No 121 transaction stored or updated after API-call, because waiting transaction is already stored earlier and will remain 'waiting' at this stage (to be updated via callback)
  }
}
