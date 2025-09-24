import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Redis } from 'ioredis';

import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/dtos/safaricom-timeout-callback.dto';
import { SafaricomTimeoutCallbackJobDto } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/dtos/safaricom-timeout-callback-job.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/dtos/safaricom-transfer-callback.dto';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/dtos/safaricom-transfer-callback-job.dto';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Injectable()
export class SafaricomReconciliationService {
  public constructor(
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionEventsService: TransactionEventsService,
    private readonly queuesService: QueuesRegistryService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async processTransferCallback(
    safaricomTransferCallback: SafaricomTransferCallbackDto,
  ): Promise<void> {
    const safaricomTransferCallbackJob: SafaricomTransferCallbackJobDto = {
      originatorConversationId:
        safaricomTransferCallback.Result.OriginatorConversationID,
      mpesaConversationId: safaricomTransferCallback.Result.ConversationID,
      mpesaTransactionId: safaricomTransferCallback.Result.TransactionID,
      resultCode: safaricomTransferCallback.Result.ResultCode,
      resultDescription: safaricomTransferCallback.Result.ResultDesc,
    };

    const job = await this.queuesService.safaricomTransferCallbackQueue.add(
      JobNames.default,
      safaricomTransferCallbackJob,
    );

    await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
  }

  public async processTimeoutCallback(
    safaricomTimeoutCallback: SafaricomTimeoutCallbackDto,
  ): Promise<void> {
    if (
      !safaricomTimeoutCallback.OriginatorConversationID ||
      safaricomTimeoutCallback.OriginatorConversationID === ''
    ) {
      console.error(
        `Safaricom Timeout Callback does not contain OriginatorConversationID. Body: ${JSON.stringify(
          safaricomTimeoutCallback,
        )}`,
      );
      throw new Error(
        `Safaricom Timeout Callback does not contain OriginatorConversationID.`,
      );
    }
    const safaricomTimeoutCallbackJob: SafaricomTimeoutCallbackJobDto = {
      originatorConversationId:
        safaricomTimeoutCallback.OriginatorConversationID,
    };

    const job = await this.queuesService.safaricomTimeoutCallbackQueue.add(
      JobNames.default,
      safaricomTimeoutCallbackJob,
    );

    await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
  }

  public async processSafaricomTransferCallbackJob(
    safaricomTransferCallbackJob: SafaricomTransferCallbackJobDto,
  ): Promise<void> {
    // Find the actual safaricom transfer by originatorConversationId
    const safaricomTransfer =
      await this.safaricomTransferScopedRepository.getByOriginatorConversationId(
        safaricomTransferCallbackJob.originatorConversationId,
      );
    const transactionId = safaricomTransfer.transactionId;
    const programFspConfigurationId =
      this.getProgramFspConfigIdFromLatestEvent(safaricomTransfer);

    // Prepare the transaction status based on resultCode from callback
    let transactionStatus: TransactionStatusEnum;
    let errorMessage: string | undefined;
    if (safaricomTransferCallbackJob.resultCode === 0) {
      transactionStatus = TransactionStatusEnum.success;
    } else {
      transactionStatus = TransactionStatusEnum.error;
      errorMessage = `${safaricomTransferCallbackJob.resultCode} - ${safaricomTransferCallbackJob.resultDescription}`;
    }

    // Update safaricom transfer with mpesaTransactionId
    await this.safaricomTransferScopedRepository.update(
      { id: safaricomTransfer.id },
      {
        mpesaTransactionId: safaricomTransferCallbackJob.mpesaTransactionId,
        mpesaConversationId: safaricomTransferCallbackJob.mpesaConversationId, // This should already be updated on initial request response, but just in case (e.g 121-service crash)
      },
    );

    // Update transaction status
    await this.transactionScopedRepository.update(
      { id: safaricomTransfer.transaction.id },
      {
        status: transactionStatus,
      },
    );

    // create transaction event
    await this.transactionEventsService.createEvent({
      transactionId,
      userId: null,
      type: TransactionEventType.processingStep,
      description: TransactionEventDescription.safaricomCallbackReceived,
      errorMessage,
      programFspConfigurationId,
    });
  }

  public async processSafaricomTimeoutCallbackJob(
    safaricomTimeoutCallbackJob: SafaricomTimeoutCallbackJobDto,
  ): Promise<void> {
    try {
      // Find the actual safaricom transfer by originatorConversationId
      const safaricomTransfer =
        await this.safaricomTransferScopedRepository.getByOriginatorConversationId(
          safaricomTimeoutCallbackJob.originatorConversationId,
        );
      const transactionId = safaricomTransfer.transactionId;
      const programFspConfigurationId =
        this.getProgramFspConfigIdFromLatestEvent(safaricomTransfer);

      // Update transaction status
      await this.transactionScopedRepository.update(
        { id: safaricomTransfer.transaction.id },
        {
          status: TransactionStatusEnum.error,
        },
      );
      // create transaction event
      await this.transactionEventsService.createEvent({
        transactionId,
        userId: null,
        type: TransactionEventType.processingStep,
        description: TransactionEventDescription.safaricomCallbackReceived,
        errorMessage: 'Transfer timed out',
        programFspConfigurationId,
      });
    } catch (error) {
      // This should never happen. This way, if it happens, we receive an alert
      if (error instanceof NotFoundException) {
        throw new InternalServerErrorException(error.message);
      }

      throw error;
    }
  }

  private getProgramFspConfigIdFromLatestEvent(safaricomTransfer) {
    const latestEvent = [
      ...safaricomTransfer.transaction.transactionEvents,
    ].sort((a, b) => b.created.getTime() - a.created.getTime())[0];
    return latestEvent.programFspConfigurationId;
  }
}
