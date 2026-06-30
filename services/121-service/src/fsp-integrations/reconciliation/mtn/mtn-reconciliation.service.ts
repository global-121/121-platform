import { Injectable } from '@nestjs/common';

import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { MtnTransferReconciliationJobDto } from '@121-service/src/fsp-integrations/reconciliation/mtn/dtos/mtn-transfer-reconciliation-job.dto';
import { MTN_RECONCILIATION_MAX_TRANSACTIONS_PER_RUN } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.config';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
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

  public async doMtnReconciliation(): Promise<number> {
    const transactionIds =
      await this.transactionRepository.getWaitingTransactionIdsByFsp({
        fspName: Fsps.mtn,
        limit: MTN_RECONCILIATION_MAX_TRANSACTIONS_PER_RUN,
      });

    await Promise.all(
      transactionIds.map(async (transactionId) => {
        const mtnTransferReconciliationJob: MtnTransferReconciliationJobDto = {
          transactionId,
        };

        // Use the transactionId as a deterministic jobId so a transaction that is
        // still queued from a previous run is not added to the queue twice.
        await this.queuesService.mtnTransferReconciliationQueue.add(
          JobNames.default,
          mtnTransferReconciliationJob,
          { jobId: transactionId, removeOnFail: true },
        );
      }),
    );

    return transactionIds.length;
  }

  public async processMtnTransferReconciliationJob(
    mtnTransferReconciliationJob: MtnTransferReconciliationJobDto,
  ): Promise<void> {
    const currentStatus = await this.transactionRepository.getStatusByIdOrThrow(
      mtnTransferReconciliationJob.transactionId,
    );
    if (currentStatus !== TransactionStatusEnum.waiting) {
      return;
    }

    // 1. Look up registration referenceId from transaction
    const registrationReferenceId =
      await this.transactionRepository.getReferenceIdByTransactionIdOrThrow(
        mtnTransferReconciliationJob.transactionId,
      );

    // 2. Regenerate mtnReferenceId to verify transfer status via MTN API
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        mtnTransferReconciliationJob.transactionId,
      );
    const mtnReferenceId = this.mtnService.generateMtnReferenceId({
      referenceId: registrationReferenceId,
      transactionId: mtnTransferReconciliationJob.transactionId,
      failedTransactionAttempts,
    });

    // 3. Look up per-program MTN wallet credentials
    const latestEvent =
      await this.transactionEventScopedRepository.findLatestEventByTransactionId(
        mtnTransferReconciliationJob.transactionId,
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

    await this.transactionsService.saveProgressFromExternalSource({
      transactionId: mtnTransferReconciliationJob.transactionId,
      description: TransactionEventDescription.mtnReconciliationProcessed,
      newTransactionStatus: transactionStatus,
      errorMessage:
        transactionStatus === TransactionStatusEnum.error
          ? (transferStatus.reason ?? 'unknown')
          : undefined,
    });
  }
}
