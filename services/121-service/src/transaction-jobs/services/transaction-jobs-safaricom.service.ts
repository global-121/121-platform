import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { DuplicateOriginatorConversationIdError } from '@121-service/src/payments/fsp-integration/safaricom/errors/duplicate-originator-conversation-id.error';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';

@Injectable()
export class TransactionJobsSafaricomService {
  constructor(
    private readonly safaricomService: SafaricomService,
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  public async processSafaricomTransactionJob(
    transactionJob: SafaricomTransactionJobDto,
  ): Promise<void> {
    // 1. Get additional data
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    // 2. Check for existing Safaricom Transfer with the same originatorConversationId, because that means this job has already been (partly) processed. In case of a server crash, jobs that were in process are processed again.
    let safaricomTransfer =
      await this.safaricomTransferScopedRepository.findOne({
        where: {
          originatorConversationId: Equal(
            transactionJob.originatorConversationId,
          ),
        },
      });
    // if no safaricom transfer yet, create a transaction, otherwise this has already happened before
    let transactionId: number;
    if (!safaricomTransfer) {
      const transaction =
        await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
          {
            registration,
            transactionJob,
            transferAmountInMajorUnit: transactionJob.transactionAmount,
            status: TransactionStatusEnum.waiting, // This will only go to 'success' via callback
          },
        );
      transactionId = transaction.id;

      // TODO: combine this with the transaction creation above in one SQL transaction
      const newSafaricomTransfer = new SafaricomTransferEntity();
      newSafaricomTransfer.originatorConversationId =
        transactionJob.originatorConversationId;
      newSafaricomTransfer.transactionId = transactionId;
      safaricomTransfer =
        await this.safaricomTransferScopedRepository.save(newSafaricomTransfer);
    } else {
      transactionId = safaricomTransfer.transactionId;
    }

    // 3. Start the transfer, if failure update to error transaction and return early
    try {
      await this.safaricomService.doTransfer({
        transferAmount: transactionJob.transactionAmount,
        phoneNumber: transactionJob.phoneNumber!,
        idNumber: transactionJob.idNumber!,
        originatorConversationId: transactionJob.originatorConversationId!,
      });
    } catch (error) {
      if (error instanceof DuplicateOriginatorConversationIdError) {
        // Return early, as this job re-attempt has already been processed before, which should not be overwritten
        console.error(error.message);
        return;
      } else if (error instanceof SafaricomApiError) {
        await this.transactionScopedRepository.update(
          { id: transactionId },
          { status: TransactionStatusEnum.error, errorMessage: error?.message },
        );
        return;
      } else {
        throw error;
      }
    }

    // 4. No messages sent for safaricom

    // 5. No transaction stored or updated after API-call, because waiting transaction is already stored earlier and will remain 'waiting' at this stage (to be updated via callback)
  }
}
