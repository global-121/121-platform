import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { EXTERNAL_API } from '../../../config';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { PaTransactionResultDto } from '../../../payments/dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../../payments/transactions/transaction.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { generateRandomString } from '../../../utils/getRandomValue.helper';
import { waitFor } from '../../../utils/waitFor.helper';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { TransactionRelationDetailsDto } from '../../dto/transaction-relation-details.dto';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '../../enum/queue.names.enum';
import { getRedisSetName, REDIS_CLIENT } from '../../redis-client';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { SafaricomJobDto } from './dto/safaricom-job.dto';
import { SafaricomTransferPayload } from './dto/safaricom-transfer-payload.dto';
import { SafaricomRequestEntity } from './safaricom-request.entity';
import { SafaricomApiService } from './safaricom.api.service';

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
    const referenceIds = paymentList.map((payment) => payment.referenceId);
    const userInfo = await this.getUserInfo(referenceIds);

    for (const paPaymentData of paymentList) {
      const job = await this.paymentSafaricomQueue.add(
        ProcessNamePayment.sendPayment,
        {
          userInfo: userInfo,
          paPaymentData: paPaymentData,
          programId: programId,
          paymentNr: paymentNr,
          userId: paPaymentData.userId,
        },
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async getQueueProgress(programId?: number): Promise<number> {
    if (programId) {
      // Get the count of job IDs in the Redis set for the program
      const count = await this.redisClient.scard(getRedisSetName(programId));
      return count;
    } else {
      // If no programId is provided, use Bull's method to get the total delayed count
      // This requires an instance of the Bull queue
      const delayedCount = await this.paymentSafaricomQueue.getDelayedCount();
      return delayedCount;
    }
  }

  public async processQueuedPayment(jobData: SafaricomJobDto): Promise<void> {
    await this.safaricomApiService.authenticate();
    const resultUser = jobData.userInfo.find(
      (user) => user.referenceId == jobData.paPaymentData.referenceId,
    );

    const payload = this.createPayloadPerPa(
      jobData.paPaymentData,
      jobData.programId,
      jobData.paymentNr,
      resultUser,
    );

    const paymentRequestResultPerPa = await this.sendPaymentPerPa(
      payload,
      jobData.paPaymentData.referenceId,
    );

    const transactionRelationDetails: TransactionRelationDetailsDto = {
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
  public async getUserInfo(
    referenceIds: string[],
  ): Promise<{ id: string; referenceId: string; value: string }[]> {
    return await this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        'registration."registrationProgramId" AS id',
        'registration.referenceId AS "referenceId"',
        'data.value AS value',
      ])
      .where('registration.referenceId IN (:...referenceIds)', {
        referenceIds: referenceIds,
      })
      .andWhere('programQuestion.name IN (:...names)', {
        names: ['nationalId'],
      })
      .leftJoin('registration.data', 'data')
      .leftJoin('data.programQuestion', 'programQuestion')
      .getRawMany();
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    programId: number,
    paymentNr: number,
    userInfo: { id: string; referenceId: string; value: string },
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

    const payload = {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: paymentData.transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A,
      PartyB: paymentData.paymentAddress,
      Remarks: `Payment ${paymentNr}`,
      QueueTimeOutURL: EXTERNAL_API.safaricomQueueTimeoutUrl,
      ResultURL: EXTERNAL_API.safaricomResultUrl,
      Occassion: paymentData.referenceId,
      OriginatorConversationID: `P${programId}PA${userInfo.id}_${formatDate(
        new Date(),
      )}_${generateRandomString(3)}`,
      IDType: process.env.SAFARICOM_IDTYPE,
      IDNumber: userInfo.value,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: SafaricomTransferPayload,
    referenceId: string,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.safaricom;
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

    let paymentStatus = null;

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
