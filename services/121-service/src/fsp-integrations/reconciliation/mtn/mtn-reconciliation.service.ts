import { Injectable } from '@nestjs/common';

import { MtnTransferCallbackDto } from '@121-service/src/fsp-integrations/reconciliation/mtn/dtos/mtn-transfer-callback.dto';
import { MtnTransferCallbackJobDto } from '@121-service/src/fsp-integrations/reconciliation/mtn/dtos/mtn-transfer-callback-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Injectable()
export class MtnReconciliationService {
  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly queuesService: QueuesRegistryService,
  ) {}

  public async processTransferCallback(
    mtnTransferCallback: MtnTransferCallbackDto,
  ): Promise<void> {
    const mtnTransferCallbackJob: MtnTransferCallbackJobDto = {
      transactionId: Number(mtnTransferCallback.externalId),
      referenceId: mtnTransferCallback.referenceId,
      status: mtnTransferCallback.status,
      reason: mtnTransferCallback.reason,
    };

    await this.queuesService.mtnTransferCallbackQueue.add(
      JobNames.default,
      mtnTransferCallbackJob,
    );
  }

  public async processMtnTransferCallbackJob(
    mtnTransferCallbackJob: MtnTransferCallbackJobDto,
  ): Promise<void> {
    const transactionStatus = this.mapMtnStatusToTransactionStatus({
      mtnStatus: mtnTransferCallbackJob.status,
    });

    await this.transactionsService.saveProgressFromExternalSource({
      transactionId: mtnTransferCallbackJob.transactionId,
      description: TransactionEventDescription.mtnCallbackReceived,
      newTransactionStatus: transactionStatus,
      errorMessage:
        transactionStatus === TransactionStatusEnum.error
          ? `MTN transfer failed with reason: ${mtnTransferCallbackJob.reason ?? 'unknown'}`
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
      case 'FAILED':
        return TransactionStatusEnum.error;
      case 'PENDING':
        return TransactionStatusEnum.waiting;
      default:
        return TransactionStatusEnum.error;
    }
  }
}
