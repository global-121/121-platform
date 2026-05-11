import { Injectable } from '@nestjs/common';

import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
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
    private readonly mtnService: MtnService,
    private readonly transactionsService: TransactionsService,
    private readonly queuesService: QueuesRegistryService,
  ) {}

  public async processTransferCallback(
    mtnTransferCallback: MtnTransferCallbackDto,
  ): Promise<void> {
    console.log(
      '[MTN Callback] Received callback:',
      JSON.stringify(mtnTransferCallback),
    );

    const { externalId, status } = mtnTransferCallback;

    if (!externalId || !status) {
      console.warn(
        `[MTN Callback] Dropping callback with missing required fields - externalId: ${externalId}, status: ${status}`,
      );
      return;
    }

    const transactionId = Number(externalId);
    if (Number.isNaN(transactionId)) {
      console.warn(
        `[MTN Callback] Dropping callback with non-numeric externalId: ${externalId}`,
      );
      return;
    }

    if (
      !Object.values(MtnTransferStatus).includes(status as MtnTransferStatus)
    ) {
      console.warn(
        `[MTN Callback] Received unknown status '${status}' for transactionId: ${transactionId}. Processing as error.`,
      );
    }

    const mtnTransferCallbackJob: MtnTransferCallbackJobDto = {
      transactionId,
      referenceId: mtnTransferCallback.referenceId ?? '',
      status: status as MtnTransferStatus,
      reason: mtnTransferCallback.reason,
    };

    console.log(
      `[MTN Callback] Processing callback - transactionId: ${mtnTransferCallbackJob.transactionId}, status: ${mtnTransferCallbackJob.status}`,
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
      `[MTN Callback Job] Processing job - transactionId: ${mtnTransferCallbackJob.transactionId}, referenceId: ${mtnTransferCallbackJob.referenceId}`,
    );

    const transactionStatus = this.mtnService.mapMtnStatusToTransactionStatus({
      mtnStatus: mtnTransferCallbackJob.status,
    });

    console.log(
      `[MTN Callback Job] Mapped status - transactionId: ${mtnTransferCallbackJob.transactionId}, mtnStatus: ${mtnTransferCallbackJob.status}, mappedStatus: ${transactionStatus}`,
    );

    await this.transactionsService.saveProgressFromExternalSource({
      transactionId: mtnTransferCallbackJob.transactionId,
      description: TransactionEventDescription.mtnCallbackReceived,
      newTransactionStatus: transactionStatus,
      errorMessage:
        transactionStatus === TransactionStatusEnum.error
          ? (mtnTransferCallbackJob.reason ?? 'unknown')
          : undefined,
    });

    console.log(
      `[MTN Callback Job] Completed processing - transactionId: ${mtnTransferCallbackJob.transactionId}, finalStatus: ${transactionStatus}`,
    );
  }
}
