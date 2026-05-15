import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { env } from '@121-service/src/env';
import { MtnTransferResult } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-result.enum';
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
        if (error.type === MtnTransferResult.duplicate) {
          // 6a. Duplicate: this is a queue retry where the original request already went through
          // Use GetTransferStatus to determine the actual outcome
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
    // Final status will be set via the callback flow (triggered below by polling).
    await this.transactionsService.saveProgress({
      context: transactionEventContext,
      description: TransactionEventDescription.mtnRequestSent,
    });

    // 8. Poll MTN for the actual transfer status and trigger our own callback endpoint.
    // MTN sandbox does not reliably send callbacks, so we call our callback ourselves.
    // This way we use the exact same code path as a real callback from MTN.
    await this.pollAndTriggerCallback({
      mtnReferenceId,
      requestIdentity,
      transactionId: transactionJob.transactionId,
    });
  }

  private async pollAndTriggerCallback({
    mtnReferenceId,
    requestIdentity,
    transactionId,
  }: {
    mtnReferenceId: string;
    requestIdentity: MtnRequestIdentity;
    transactionId: number;
  }): Promise<void> {
    const maxAttempts = 5;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const transferStatus = await this.mtnService.getTransferStatus({
        mtnReferenceId,
        requestIdentity,
      });

      if (transferStatus.status !== 'PENDING') {
        // Hit our own callback endpoint, exactly like MTN would in production.
        await this.invokeMtnCallbackEndpoint({
          externalId: String(transactionId),
          referenceId: mtnReferenceId,
          status: transferStatus.status,
          reason: transferStatus.reason,
        });
        return;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.warn(
      `[MTN] Transfer ${mtnReferenceId} still PENDING after ${maxAttempts} polls. Leaving transaction in 'waiting'.`,
    );
  }

  private async invokeMtnCallbackEndpoint({
    externalId,
    referenceId,
    status,
    reason,
  }: {
    externalId: string;
    referenceId: string;
    status: string;
    reason?: string;
  }): Promise<void> {
    const callbackUrl = `${env.EXTERNAL_121_SERVICE_URL ?? 'http://localhost:3000'}/api/fsps/mtn/transfer-callback`;
    const body = { externalId, referenceId, status, reason: reason ?? '' };

    console.log(
      `[MTN] Invoking callback endpoint at ${callbackUrl} with body:`,
      JSON.stringify(body),
    );

    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        `[MTN] Callback endpoint returned ${response.status}: ${responseText}`,
      );
    }
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
    const transferStatus = await this.mtnService.getTransferStatus({
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
