import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { DoTransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
import { SafaricomTransferRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { FinancialServiceProviderCallbackQueuesNames } from '@121-service/src/shared/enum/financial-service-provider-callback-queue-names.enum';
import { PaymentQueueNames } from '@121-service/src/shared/enum/payment-queue-names.enum';

@Injectable()
export class SafaricomService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    private readonly safaricomTransferRepository: SafaricomTransferRepository,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    @InjectQueue(
      FinancialServiceProviderCallbackQueuesNames.safaricomTransferCallback,
    )
    private readonly safaricomTransferCallbackQueue: Queue,
  ) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentNr: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  public async doTransfer(
    transferData: DoTransferParams,
  ): Promise<DoTransferReturnType> {
    // Store initial transfer record before transfer because of callback
    const safaricomTransfer = new SafaricomTransferEntity();
    safaricomTransfer.originatorConversationId =
      transferData.originatorConversationId;
    safaricomTransfer.transactionId = transferData.transactionId;

    // Save the safaricom transfer entity
    await this.safaricomTransferRepository.save(safaricomTransfer);

    // Do transfer
    await this.safaricomApiService.authenticate();

    // Prepare the transfer payload and send the request to safaricom
    const transferPayload =
      this.safaricomApiService.createTransferPayload(transferData);
    const transferResult =
      await this.safaricomApiService.sendTransfer(transferPayload);

    // Update transfer record with conversation ID
    await this.safaricomTransferRepository.update(
      { id: safaricomTransfer.id },
      { mpesaConversationId: transferResult.ConversationID },
    );

    return {
      originatorConversationId: transferResult.OriginatorConversationID,
      conversationId: transferResult.ConversationID,
    };
  }

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

    const job = await this.safaricomTransferCallbackQueue.add(
      PaymentQueueNames.financialServiceProviderCallback,
      safaricomTransferCallbackJob,
    );

    await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
  }
}
