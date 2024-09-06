import { EXTERNAL_API } from '@121-service/src/config';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { TransferParams } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-params.interface';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { DoTransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
import { SafaricomTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer.interface';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-transfer.entity';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import { FinancialServiceProviderCallbackQueuesNames } from '@121-service/src/shared/enum/financial-service-provider-callback-queue-names.enum';
import { PaymentQueueNames } from '@121-service/src/shared/enum/payment-queue-names.enum';
import { generateRandomString } from '@121-service/src/utils/getRandomValue.helper';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';

@Injectable()
export class SafaricomService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(SafaricomTransferEntity)
  private readonly safaricomTransferRepository: Repository<SafaricomTransferEntity>;

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
    transferData: SafaricomTransferParams,
  ): Promise<DoTransferReturnType> {
    await this.safaricomApiService.authenticate();

    const payload = this.createPayloadPerPa(transferData);

    return await this.sendPaymentPerPa(payload);
  }

  public createPayloadPerPa(
    transferData: SafaricomTransferParams,
  ): TransferParams {
    function padTo2Digits(num: number): string {
      return num.toString().padStart(2, '0');
    }

    function formatDate(date: Date): string {
      return [
        date.getFullYear().toString().substring(2),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('');
    }

    return {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME!,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL!,
      CommandID: 'BusinessPayment',
      Amount: transferData.transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A!,
      PartyB: transferData.phoneNumber, // Set to empty string to trigger mock failure
      Remarks: `Payment ${transferData.paymentNr}`, // This data shows up in Safaricom reconciliation reports, and the KRCS Team uses it.
      QueueTimeOutURL: EXTERNAL_API.safaricomQueueTimeoutUrl, // TODO: Check if we need to implement this. Now this has an endpoint that does not exist.
      ResultURL: EXTERNAL_API.safaricomResultUrl,
      Occassion: transferData.referenceId,
      OriginatorConversationID: `P${transferData.programId}_${formatDate(
        new Date(),
      )}_${generateRandomString(3)}`, // TODO: Implement idempotency like Ashish proposed in: https://dev.azure.com/redcrossnl/121%20Platform/_sprints/taskboard/121%20Development%20Team/121%20Platform/Sprint%20135?workitem=29155
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: transferData.idNumber,
    };
  }

  public async sendPaymentPerPa(
    payload: TransferParams,
  ): Promise<DoTransferReturnType> {
    const result = await this.safaricomApiService.transfer(payload);

    if (result && result.ResponseCode !== '0') {
      throw new Error(result.errorMessage);
    }

    return {
      originatorConversationId: result.OriginatorConversationID,
      conversationId: result.ConversationID,
    };
  }

  public async processSafaricomCallback(
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
