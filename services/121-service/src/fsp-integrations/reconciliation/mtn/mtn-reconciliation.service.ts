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

    const { externalId } = mtnTransferCallback;

    if (!externalId) {
      return;
    }

    const transactionId = Number(externalId);
    if (Number.isNaN(transactionId)) {
      return;
    }

    const mtnTransferCallbackJob: MtnTransferCallbackJobDto = {
      transactionId,
    };

    await this.queuesService.mtnTransferCallbackQueue.add(
      JobNames.default,
      mtnTransferCallbackJob,
    );
  }

  public async processMtnTransferCallbackJob(
    mtnTransferCallbackJob: MtnTransferCallbackJobDto,
  ): Promise<void> {

    const currentStatus = await this.transactionRepository.getStatusByIdOrThrow(
      mtnTransferCallbackJob.transactionId,
    );
    if (currentStatus !== TransactionStatusEnum.waiting) {
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

    await this.transactionsService.saveProgressFromExternalSource({
      transactionId: mtnTransferCallbackJob.transactionId,
      description: TransactionEventDescription.mtnCallbackReceived,
      newTransactionStatus: transactionStatus,
      errorMessage:
        transactionStatus === TransactionStatusEnum.error
          ? (transferStatus.reason ?? 'unknown')
          : undefined,
    });
  }
}
