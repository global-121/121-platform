import { EXTERNAL_API } from '@121-service/src/config';
import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { SafaricomJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dto/safaricom-job.dto';
import { SafaricomTransferPayload } from '@121-service/src/payments/fsp-integration/safaricom/dto/safaricom-transfer-payload.dto';
import { SafaricomRequestEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-request.entity';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { generateRandomString } from '@121-service/src/utils/getRandomValue.helper';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

@Injectable()
export class SafaricomService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(SafaricomRequestEntity)
  private readonly safaricomRequestRepository: Repository<SafaricomRequestEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    private readonly transactionsService: TransactionsService,
    @InjectQueue(QueueNamePayment.paymentSafaricom)
    private readonly paymentSafaricomQueue: Queue,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<void> {
    for (const paPaymentData of paymentList) {
      const jobData: SafaricomJobDto = {
        paPaymentData: paPaymentData,
        programId: programId,
        paymentNr: paymentNr,
        userId: paPaymentData.userId,
      };
      const job = await this.paymentSafaricomQueue.add(
        ProcessNamePayment.sendPayment,
        jobData,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async processQueuedPayment(jobData: SafaricomJobDto): Promise<void> {
    await this.safaricomApiService.authenticate();

    // TODO Refactor this to get all this data before the job is created at once
    const registrationData = await this.getRegistrationProgramIdAndNationalId(
      jobData.paPaymentData.referenceId,
    );

    const nationalId = registrationData?.nationalId;
    const registrationProgramId = registrationData?.registrationProgramId;

    const payload = this.createPayloadPerPa(
      jobData.paPaymentData,
      jobData.programId,
      jobData.paymentNr,
      nationalId,
      registrationProgramId,
    );

    const paymentRequestResultPerPa = await this.sendPaymentPerPa(
      payload,
      jobData.paPaymentData.referenceId,
    );

    const transactionRelationDetails = {
      programId: jobData.programId,
      paymentNr: jobData.paymentNr,
      userId: jobData.userId,
    };
    // Storing the per payment so you can continiously seed updates of transactions in Portal
    const transaction =
      await this.transactionsService.storeTransactionUpdateStatus(
        paymentRequestResultPerPa,
        transactionRelationDetails,
      );

    await this.processSafaricomRequest(
      payload,
      paymentRequestResultPerPa,
      transaction,
    );
  }

  // TODO refactor this to a different name RegistrationInfo?
  public async getRegistrationProgramIdAndNationalId(
    referenceId: string,
  ): Promise<
    { registrationProgramId: number; nationalId: string } | undefined
  > {
    return await this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        'registration."registrationProgramId" AS "registrationProgramId"',
        'data.value AS "nationalId"',
      ])
      .where('registration.referenceId = :referenceId', {
        referenceId: referenceId,
      })
      .andWhere('programQuestion.name IN (:...names)', {
        names: ['nationalId'],
      })
      .leftJoin('registration.data', 'data')
      .leftJoin('data.programQuestion', 'programQuestion')
      .getRawOne();
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    programId: number,
    paymentNr: number,
    nationalId: string | undefined,
    registrationProgramId: number | undefined,
  ): SafaricomTransferPayload {
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
      Amount: paymentData.transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A!,
      PartyB: paymentData.paymentAddress,
      Remarks: `Payment ${paymentNr}`,
      QueueTimeOutURL: EXTERNAL_API.safaricomQueueTimeoutUrl,
      ResultURL: EXTERNAL_API.safaricomResultUrl,
      Occassion: paymentData.referenceId,
      OriginatorConversationID: `P${programId}PA${registrationProgramId}_${formatDate(
        new Date(),
      )}_${generateRandomString(3)}`,
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: nationalId,
    };
  }

  public async sendPaymentPerPa(
    payload: SafaricomTransferPayload,
    referenceId: string,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FinancialServiceProviderName.safaricom;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.Amount;

    const result = await this.safaricomApiService.transfer(payload);

    if (result && result.ResponseCode === '0') {
      paTransactionResult.status = StatusEnum.waiting;
      payload.status = StatusEnum.waiting;
    } else {
      paTransactionResult.status = StatusEnum.error;
      payload.status = StatusEnum.error;
      paTransactionResult.message = result.errorMessage;
    }

    paTransactionResult.customData = {
      requestResult: result,
    };
    return paTransactionResult;
  }

  public async processSafaricomRequest(
    payload,
    paymentRequestResultPerPa,
    transaction: TransactionEntity,
  ): Promise<any> {
    const payloadResult = Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [
        k.charAt(0).toLowerCase() + k.slice(1),
        v,
      ]),
    );

    const safaricomCustomData = { ...paymentRequestResultPerPa.customData };

    payloadResult.requestResult = safaricomCustomData.requestResult;
    payloadResult.conversationID =
      safaricomCustomData &&
      safaricomCustomData.requestResult &&
      safaricomCustomData.requestResult.ConversationID
        ? safaricomCustomData.requestResult.ConversationID
        : 'Invalid Request';
    payloadResult.transaction = transaction;
    await this.safaricomRequestRepository.save(payloadResult);
  }

  public async processSafaricomResult(
    safaricomPaymentResultData: any,
    attempt = 1,
  ): Promise<void> {
    const safaricomDbRequest = await this.safaricomRequestRepository
      .createQueryBuilder('safaricom_request')
      .leftJoinAndSelect('safaricom_request.transaction', 'transaction')
      .where(
        'safaricom_request.originatorConversationID = :originatorConversationID',
        {
          originatorConversationID:
            safaricomPaymentResultData.Result.OriginatorConversationID,
        },
      )
      .getMany();
    if (safaricomDbRequest[0] === undefined && attempt <= 3) {
      attempt++;
      await waitFor(850);
      await this.processSafaricomResult(safaricomPaymentResultData, attempt);
      return;
    }

    let paymentStatus: StatusEnum | null = null;

    if (
      safaricomPaymentResultData &&
      safaricomPaymentResultData.Result &&
      safaricomPaymentResultData.Result.ResultCode === 0
    ) {
      paymentStatus = StatusEnum.success;
    } else {
      paymentStatus = StatusEnum.error;
      safaricomDbRequest[0].transaction.errorMessage =
        safaricomPaymentResultData.Result.ResultDesc;
    }

    safaricomDbRequest[0].status = paymentStatus;
    safaricomDbRequest[0].paymentResult = safaricomPaymentResultData;

    const safaricomCustomData = {
      ...safaricomDbRequest[0].transaction.customData,
    };
    safaricomCustomData['paymentResult'] = safaricomPaymentResultData;
    safaricomDbRequest[0].transaction.status = paymentStatus;
    safaricomDbRequest[0].transaction.customData = safaricomCustomData;

    await this.safaricomRequestRepository.save(safaricomDbRequest);
    await this.transactionRepository.save(safaricomDbRequest[0].transaction);
  }
}
