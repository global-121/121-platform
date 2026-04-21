import { Injectable } from '@nestjs/common';

import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiDuplicateError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api-duplicate.error';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/transaction-job-service.interface';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { MtnTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/mtn-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

@Injectable()
export class TransactionJobsMtnService implements TransactionJobService<MtnTransactionJobDto> {
  constructor(
    private readonly mtnService: MtnService,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionsService: TransactionsService,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
    private readonly programRepository: ProgramRepository,
  ) {}

  public async processTransactionJob(
    transactionJob: MtnTransactionJobDto,
  ): Promise<void> {
    // 1. Log transaction-job start: create 'initiated'/'retry' transaction event, set transaction to 'waiting' and update registration (if 'initiated')
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };
    await this.transactionJobsHelperService.logTransactionJobStart({
      context: transactionEventContext,
      isRetry: transactionJob.isRetry,
    });

    // 2. Create idempotency key (used as X-Reference-Id for MTN API)
    // This ensures:
    //   a. Payment retry: a new mtnReferenceId is generated (different failedTransactionAttempts count), which will not be blocked by MTN API, as desired.
    //   b. Queue retry: the same mtnReferenceId is generated (same failedTransactionAttempts count), which will be blocked by MTN API as duplicate, as desired.
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );
    const mtnReferenceId = generateUUIDFromSeed(
      `ReferenceId=${transactionJob.referenceId},TransactionId=${transactionJob.transactionId},Attempt=${failedTransactionAttempts}`,
    );

    // 3. Look up program currency for the MTN API
    const program = await this.programRepository.findByIdOrFail(
      transactionJob.programId,
    );

    if (!program.currency) {
      await this.transactionsService.saveProgress({
        context: transactionEventContext,
        description: TransactionEventDescription.mtnRequestSent,
        errorMessage: `Program ${transactionJob.programId} has no currency configured`,
        newTransactionStatus: TransactionStatusEnum.error,
      });
      return;
    }

    // 4. Call MTN transfer endpoint, if failure handle accordingly and return early
    try {
      await this.mtnService.createTransfer({
        referenceId: mtnReferenceId,
        amount: String(transactionJob.transferValue),
        currency: program.currency,
        externalId: String(transactionJob.transactionId),
        payee: {
          partyIdType: 'MSISDN',
          partyId: transactionJob.phoneNumber,
        },
        payerMessage: `Payment for transaction ${transactionJob.transactionId}`,
        payeeNote: `Payment for transaction ${transactionJob.transactionId}`,
      });
    } catch (error) {
      if (error instanceof MtnApiDuplicateError) {
        // 5a. Duplicate: this is a queue retry where the original request already went through
        // Use GetTransferStatus to determine the actual outcome
        await this.handleDuplicateTransfer({
          mtnReferenceId,
          transactionEventContext,
        });
        return;
      }
      if (error instanceof MtnApiError) {
        // 5b. Other API error: store error transaction event and update transaction to 'error'
        await this.transactionsService.saveProgress({
          context: transactionEventContext,
          description: TransactionEventDescription.mtnRequestSent,
          errorMessage: error.message,
          newTransactionStatus: TransactionStatusEnum.error,
        });
        return;
      }
      throw error;
    }

    // 6. Store success transaction event and leave transaction on 'waiting' (will go to final status on callback)
    await this.transactionsService.saveProgress({
      context: transactionEventContext,
      description: TransactionEventDescription.mtnRequestSent,
    });
  }

  private async handleDuplicateTransfer({
    mtnReferenceId,
    transactionEventContext,
  }: {
    mtnReferenceId: string;
    transactionEventContext: TransactionEventCreationContext;
  }): Promise<void> {
    const transferStatus = await this.mtnService.getTransferStatus({
      referenceId: mtnReferenceId,
    });

    const transactionStatus = this.mapMtnStatusToTransactionStatus({
      mtnStatus: transferStatus.status,
    });

    await this.transactionsService.saveProgress({
      context: transactionEventContext,
      description: TransactionEventDescription.mtnRequestSent,
      newTransactionStatus: transactionStatus,
      errorMessage:
        transactionStatus === TransactionStatusEnum.error
          ? `MTN transfer failed with reason: ${transferStatus.reason ?? 'unknown'}`
          : undefined,
    });
  }

  private mapMtnStatusToTransactionStatus({
    mtnStatus,
  }: {
    mtnStatus: string;
  }): TransactionStatusEnum {
    switch (mtnStatus) {
      case 'SUCCESSFUL':
        return TransactionStatusEnum.success;
      case 'PENDING':
        return TransactionStatusEnum.waiting;
      case 'FAILED':
        return TransactionStatusEnum.error;
      default:
        return TransactionStatusEnum.error;
    }
  }
}
