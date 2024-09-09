import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';

import { EXTERNAL_API } from '@121-service/src/config';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dto/safaricom-transfer-callback-job.dto';
import { DoTransferReturnParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
import { SafaricomTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer.interface';
import { SafaricomTransferPayloadParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer-payload.interface';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-transfer.entity';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import {
  ProcessNamePayment,
  QueueNamePaymentCallBack,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { generateRandomString } from '@121-service/src/utils/getRandomValue.helper';

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
    @InjectQueue(QueueNamePaymentCallBack.safaricom)
    private readonly safaricomCallbackQueue: Queue,
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
  ): Promise<DoTransferReturnParams> {
    await this.safaricomApiService.authenticate();

    const payload = this.createPayloadPerPa(transferData);

    return await this.sendPaymentPerPa(payload);
  }

  public createPayloadPerPa(
    transferData: SafaricomTransferParams,
  ): SafaricomTransferPayloadParams {
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
      Occassion: transferData.referenceId, // TODO: Check if this field is used by the KRCS Program Team, ask Tijs and/or Account Manager. Note, this field is alphanumeric.
      OriginatorConversationID: `P${transferData.programId}PA${transferData.registrationProgramId}_${formatDate(
        new Date(),
      )}_${generateRandomString(3)}`, // TODO: Implement idempotency like Ashish proposed in: https://dev.azure.com/redcrossnl/121%20Platform/_sprints/taskboard/121%20Development%20Team/121%20Platform/Sprint%20135?workitem=29155
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: transferData.nationalId,
    };
  }

  public async sendPaymentPerPa(
    payload: SafaricomTransferPayloadParams,
  ): Promise<DoTransferReturnParams> {
    const result = await this.safaricomApiService.transfer(payload);

    if (result && result.ResponseCode !== '0') {
      throw new Error(result.errorMessage);
    }

    return {
      amountTransferredInMajorUnit: payload.Amount,
      originatorConversationId: result.OriginatorConversationID,
      conversationId: result.ConversationID,
    };
  }

  public async createAndSaveSafaricomTransferData(
    safaricomDoTransferResult: DoTransferReturnParams,
    transaction: TransactionEntity,
  ): Promise<any> {
    const safaricomTransferEntity = new SafaricomTransferEntity();

    safaricomTransferEntity.mpesaConversationId =
      safaricomDoTransferResult && safaricomDoTransferResult.conversationId
        ? safaricomDoTransferResult.conversationId
        : 'Invalid Request';
    safaricomTransferEntity.originatorConversationId =
      safaricomDoTransferResult &&
      safaricomDoTransferResult.originatorConversationId
        ? safaricomDoTransferResult.originatorConversationId
        : 'Invalid Request';

    safaricomTransferEntity.transactionId = transaction.id;

    await this.safaricomTransferRepository.save(safaricomTransferEntity);
  }

  public async processSafaricomCallback(
    safaricomPaymentResultData: SafaricomTransferCallbackJobDto,
    _attempt = 1,
  ): Promise<void> {
    const job = await this.safaricomCallbackQueue.add(
      ProcessNamePayment.callbackPayment,
      safaricomPaymentResultData,
    );
    await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
  }

  public async getSafaricomTransferByOriginatorConversationId(
    originatorConversationId: string,
  ): Promise<SafaricomTransferEntity[]> {
    const safaricomTransfers = await this.safaricomTransferRepository
      .createQueryBuilder('safaricom_transfer')
      .leftJoinAndSelect('safaricom_transfer.transaction', 'transaction')
      .where(
        'safaricom_transfer."originatorConversationId" = :originatorConversationId',
        {
          originatorConversationId,
        },
      )
      .getMany();
    return safaricomTransfers;
  }

  public async updateSafaricomTransfer(
    safaricomTransfer: SafaricomTransferEntity,
  ): Promise<void> {
    await this.safaricomTransferRepository.save(safaricomTransfer);
  }
}
