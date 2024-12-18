import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback.dto';
import { SafaricomTimeoutCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback-job.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-params.interface';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.api.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Injectable()
export class SafaricomService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    private readonly queuesService: QueuesRegistryService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  // ##TODO: Unit test this function
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentNr: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  /* ##TODO:
  1. Unit test this function:
  - All cases and edge cases to verify that this function handles all possible scenarios correctly
  - transferAmount 0
  - transferAmount negative
  - phoneNumber empty string
  - idNumber empty string
  - originatorConversationId empty string
  - SafaricomApiService not available or times out?
  - Database not available or times out?

  2. Integration test this function:
  - With our Mock Service
  - Happy path
  - Key error cases: not authorized, not found, ...
  */

  public async doTransfer({
    transferAmount,
    phoneNumber,
    idNumber,
    originatorConversationId,
  }: DoTransferParams): Promise<void> {
    // Simulate timeout, use this to test unintended Redis job re-attempt, by restarting 121-service during this timeout
    // 1. Simulate crash before API-call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    const transferResult = await this.safaricomApiService.transfer({
      transferAmount,
      phoneNumber,
      idNumber,
      originatorConversationId,
    });

    // 2. Simulate crash after API call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    // Update transfer record with conversation ID
    await this.safaricomTransferScopedRepository.update(
      { originatorConversationId },
      { mpesaConversationId: transferResult.mpesaConversationId },
    );
  }

  /* ##TODO: 
  Unit test this function:
  - All cases and edge cases to verify that this function handles all possible scenarios correctly
  - Weird input data from SafaricomTransferCallbackDto that would pass automatic validation
  - originatorConversationId empty string
  - mpesaConversationId empty string or not present
  - mpesaTransactionId empty string or not present
  - resultCode 0 or not present
  - resultDescription empty string or not present
  - resultCode negative 
  - resultCode positive 
  - Queue not available or times out?
  - Redis not available or times out?

  Integration test this function:
  - Job being added to the queue
  - RedisClient being updated
  - Any "typical" error cases that could happen?
  
  */
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

  /* ## TODO:
  Unit test this function:
  - All cases and edge cases to verify that this function handles all possible scenarios correctly
  - Weird input data from SafaricomTimeoutCallbackDto that would pass automatic validation
  - InitiatorName empty string or not present
  - SecurityCredential empty string or not present
  - CommandID empty string or not present
  - Amount 0 or not present
  - PartyA empty string or not present
  - PartyB empty string or not present
  - Remarks empty string or not present
  - QueueTimeOutURL empty string or not present
  - ResultURL empty string or not present
  - OriginatorConversationID empty string or not present
  - IDType empty string or not present
  - IDNumber empty string or not present
  - Queue not available or times out?
  - Redis not available or times out?

  Integration test this function:
  - Job being added to the queue
  - RedisClient being updated
  - Any "typical" error cases that could happen?

  */
  public async processTimeoutCallback(
    safaricomTimeoutCallback: SafaricomTimeoutCallbackDto,
  ): Promise<void> {
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
}
