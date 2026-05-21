import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { MtnTransferErrorTypes } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-error-types.enum';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';
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
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );
    const mtnReferenceId = this.mtnService.generateMtnReferenceId({
      referenceId: transactionJob.referenceId,
      transactionId: transactionJob.transactionId,
      failedTransactionAttempts,
    });

    // 3. Look up program currency for the MTN API
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(transactionJob.programId) },
      select: { currency: true },
    });

    if (!program.currency) {
      await this.transactionsService.saveProgress({
        context: transactionEventContext,
        description: TransactionEventDescription.mtnRequestSent,
        errorMessage: `Program ${transactionJob.programId} has no currency configured`,
        newTransactionStatus: TransactionStatusEnum.error,
      });
      return;
    }

    // 4. Retrieve per-program MTN wallet credentials
    const requestIdentity = await this.mtnService.getMtnFspConfig({
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    });

    // 5. Call MTN transfer endpoint, if failure handle accordingly and return early
    try {
      await this.mtnService.createTransfer({
        mtnReferenceId,
        amount: String(transactionJob.transferValue),
        currency: program.currency,
        externalId: String(transactionJob.transactionId),
        phoneNumberPayment: transactionJob.phoneNumberPayment,
        transactionId: transactionJob.transactionId,
        requestIdentity,
      });
    } catch (error) {
      if (error instanceof MtnApiError) {
        if (error.type === MtnTransferErrorTypes.duplicate) {
          // 6a. Duplicate: this is a queue retry where the original request already went through
          // Use getTransfer to determine the actual outcome
          await this.handleDuplicateTransfer({
            mtnReferenceId,
            requestIdentity,
            transactionEventContext,
          });
          return;
        }
        // 6b. Other API error: store error transaction event and update transaction to 'error'
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

    // 7. Store success transaction event and leave transaction on 'waiting'.
    // Final status will be resolved by the reconciliation flow.
    await this.transactionsService.saveProgress({
      context: transactionEventContext,
      description: TransactionEventDescription.mtnRequestSent,
    });
  }

  private async handleDuplicateTransfer({
    mtnReferenceId,
    requestIdentity,
    transactionEventContext,
  }: {
    mtnReferenceId: string;
    requestIdentity: MtnRequestIdentity;
    transactionEventContext: TransactionEventCreationContext;
  }): Promise<void> {
    const transferStatus = await this.mtnService.getTransfer({
      mtnReferenceId,
      requestIdentity,
    });

    const transactionStatus = this.mtnService.mapMtnStatusToTransactionStatus({
      mtnStatus: transferStatus.status,
    });

    await this.transactionsService.saveProgress({
      context: transactionEventContext,
      description: TransactionEventDescription.mtnRequestSent,
      newTransactionStatus: transactionStatus,
      errorMessage:
        transactionStatus === TransactionStatusEnum.error
          ? (transferStatus.reason ?? 'unknown')
          : undefined,
    });
  }
}
