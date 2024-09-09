import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { EXTERNAL_API } from '@121-service/src/config';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { TransferParams } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-params.interface';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { DoTransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
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
    await this.safaricomApiService.authenticate();

    const payload = this.createPayloadPerPa(transferData);

    return await this.sendPaymentPerPa(payload);
  }

  public createPayloadPerPa(transferData: DoTransferParams): TransferParams {
    return {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME!,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL!,
      CommandID: 'BusinessPayment',
      Amount: transferData.transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A!,
      PartyB: transferData.phoneNumber, // Set to '25400000000' to trigger mock failure
      Remarks: transferData.remarks,
      QueueTimeOutURL: EXTERNAL_API.safaricomQueueTimeoutUrl,
      ResultURL: EXTERNAL_API.safaricomResultUrl,
      Occassion: transferData.occasion,
      OriginatorConversationID: transferData.originatorConversationId,
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: transferData.idNumber,
    };
  }

  public async sendPaymentPerPa(
    payload: TransferParams,
  ): Promise<DoTransferReturnType> {
    const result = await this.safaricomApiService.transfer(payload);

    if (result && result.ResponseCode !== '0') {
      throw new Error(result.errorMessage || result.ResponseDescription);
    }

    return {
      originatorConversationId: result.OriginatorConversationID,
      conversationId: result.ConversationID,
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
