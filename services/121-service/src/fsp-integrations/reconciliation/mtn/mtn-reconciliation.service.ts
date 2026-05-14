import { Injectable } from '@nestjs/common';

import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';
import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { MtnTransferCallbackDto } from '@121-service/src/fsp-integrations/reconciliation/mtn/dtos/mtn-transfer-callback.dto';
import { MtnTransferCallbackJobDto } from '@121-service/src/fsp-integrations/reconciliation/mtn/dtos/mtn-transfer-callback-job.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
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
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
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
    const requestIdentity = await this.getMtnFspConfig({
      programFspConfigurationId: latestEvent.programFspConfigurationId,
    });

    // 4. Get transfer status from MTN API
    const transferStatus = await this.mtnService.getTransferStatus({
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

  private async getMtnFspConfig({
    programFspConfigurationId,
  }: {
    programFspConfigurationId: number;
  }): Promise<MtnRequestIdentity> {
    const programFspConfigProperties =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId,
        names: [
          FspConfigurationProperties.subscriptionKeyMtn,
          FspConfigurationProperties.referenceIdMtn,
          FspConfigurationProperties.apiKeyMtn,
        ],
      });

    return {
      subscriptionKey: programFspConfigProperties.find(
        (c) => c.name === FspConfigurationProperties.subscriptionKeyMtn,
      )?.value as string,
      referenceId: programFspConfigProperties.find(
        (c) => c.name === FspConfigurationProperties.referenceIdMtn,
      )?.value as string,
      apiKey: programFspConfigProperties.find(
        (c) => c.name === FspConfigurationProperties.apiKeyMtn,
      )?.value as string,
    };
  }
}
