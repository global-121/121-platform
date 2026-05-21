import { Injectable } from '@nestjs/common';

import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { MtnTransferCallbackDto } from '@121-service/src/fsp-integrations/reconciliation/mtn/dtos/mtn-transfer-callback.dto';
import { MtnTransferCallbackJobDto } from '@121-service/src/fsp-integrations/reconciliation/mtn/dtos/mtn-transfer-callback-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Injectable()
export class MtnReconciliationService {
  public constructor(
    private readonly mtnService: MtnService,
    private readonly transactionsService: TransactionsService,
    private readonly queuesService: QueuesRegistryService,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
  ) {}

  public async processTransferCallback(
    mtnTransferCallback: MtnTransferCallbackDto,
  ): Promise<void> {
    console.log(
      '[MTN Callback] Received callback:',
      JSON.stringify(mtnTransferCallback),
    );

    const { externalId } = mtnTransferCallback;

    if (!externalId) {
      console.error(
        `[MTN Callback] Dropping callback with missing required fields - externalId: ${externalId}`,
      );
      return;
    }

    const transactionId = Number(externalId);
    if (Number.isNaN(transactionId)) {
      console.error(
        `[MTN Callback] Dropping callback with non-numeric externalId: ${externalId}`,
      );
      return;
    }

    const mtnTransferCallbackJob: MtnTransferCallbackJobDto = {
      transactionId,
    };

    console.log(
      `[MTN Callback] Enqueuing job - transactionId: ${transactionId}`,
    );

    await this.queuesService.mtnTransferCallbackQueue.add(
      JobNames.default,
      mtnTransferCallbackJob,
    );
  }

  public async processMtnTransferCallbackJob(
    mtnTransferCallbackJob: MtnTransferCallbackJobDto,
  ): Promise<void> {
    console.log(
      `[MTN Callback Job] Processing job - transactionId: ${mtnTransferCallbackJob.transactionId}`,
    );

    const currentStatus = await this.transactionRepository.getStatusByIdOrThrow(
      mtnTransferCallbackJob.transactionId,
    );
    if (currentStatus !== TransactionStatusEnum.waiting) {
      console.log(
        `[MTN Callback Job] Skipping - transaction ${mtnTransferCallbackJob.transactionId} is already in status '${currentStatus}'`,
      );
      return;
    }

    // 1. Look up registration referenceId from transaction
    const registrationReferenceId =
      await this.transactionRepository.getReferenceIdByTransactionIdOrThrow(
        mtnTransferCallbackJob.transactionId,
      );

    // 2. Regenerate mtnReferenceId to verify transfer status via MTN API
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        mtnTransferCallbackJob.transactionId,
      );
    const mtnReferenceId = this.mtnService.generateMtnReferenceId({
      referenceId: registrationReferenceId,
      transactionId: mtnTransferCallbackJob.transactionId,
      failedTransactionAttempts,
    });

    // 3. Look up per-program MTN wallet credentials
    const latestEvent =
      await this.transactionEventScopedRepository.findLatestEventByTransactionId(
        mtnTransferCallbackJob.transactionId,
      );
    const requestIdentity = await this.mtnService.getMtnFspConfig({
      programFspConfigurationId: latestEvent.programFspConfigurationId,
    });

    // 4. Get transfer from MTN API
    const transferStatus = await this.mtnService.getTransfer({
      mtnReferenceId,
      requestIdentity,
    });

    const transactionStatus = this.mtnService.mapMtnStatusToTransactionStatus({
      mtnStatus: transferStatus.status,
    });

    console.log(
      `[MTN Callback Job] Mapped status - transactionId: ${mtnTransferCallbackJob.transactionId}, mtnStatus: ${transferStatus.status}, mappedStatus: ${transactionStatus}`,
    );

    await this.transactionsService.saveProgressFromExternalSource({
      transactionId: mtnTransferCallbackJob.transactionId,
      description: TransactionEventDescription.mtnCallbackReceived,
      newTransactionStatus: transactionStatus,
      errorMessage:
        transactionStatus === TransactionStatusEnum.error
          ? (transferStatus.reason ?? 'unknown')
          : undefined,
    });

    console.log(
      `[MTN Callback Job] Completed processing - transactionId: ${mtnTransferCallbackJob.transactionId}, finalStatus: ${transactionStatus}`,
    );
  }
}
