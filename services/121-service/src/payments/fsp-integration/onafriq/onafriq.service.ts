import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { OnafriqJobDto } from '@121-service/src/payments/fsp-integration/onafriq/dto/onafriq-job.dto';
import { OnafriqTransferPayloadDto } from '@121-service/src/payments/fsp-integration/onafriq/dto/onafriq-transfer-payload.dto';
import { OnafriqRequestEntity } from '@121-service/src/payments/fsp-integration/onafriq/onafriq-request.entity';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.api.service';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis-client';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { generateRandomString } from '@121-service/src/utils/getRandomValue.helper';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

@Injectable()
export class OnafriqService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(OnafriqRequestEntity)
  private readonly onafriqRequestRepository: Repository<OnafriqRequestEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private readonly onafriqApiService: OnafriqApiService,
    private readonly transactionsService: TransactionsService,
    @InjectQueue(QueueNamePayment.paymentOnafriq)
    private readonly paymentOnafriqQueue: Queue,
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
      const job = await this.paymentOnafriqQueue.add(
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
      const delayedCount = await this.paymentOnafriqQueue.getDelayedCount();
      return delayedCount;
    }
  }

  public async processQueuedPayment(jobData: OnafriqJobDto): Promise<void> {
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

    await this.processOnafriqRequest(
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
      .leftJoin('registration.data', 'data')
      .getRawMany();
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    programId: number,
    paymentNr: number,
    userInfo: { id: string; referenceId: string; value: string },
  ): OnafriqTransferPayloadDto {
    console.log('paymentData', paymentData);
    console.log('userInfo', userInfo);
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

    const uniqueKey = `P${programId}PN${paymentNr}PA${userInfo.id}_${formatDate(
      new Date(),
    )}_${generateRandomString(5)}`; // This should be generated or retrieved appropriately
    const mfsSign = this.generateMfsSign(
      process.env.ONAFRIQ_PASSWORD,
      process.env.ONAFRIQ_BATCH_ID,
      uniqueKey,
    );

    const payload = {
      corporateCode: process.env.ONAFRIQ_CORPORATE_CODE,
      password: process.env.ONAFRIQ_PASSWORD,
      mfsSign: mfsSign,
      batchId: process.env.ONAFRIQ_BATCH_ID,
      requestBody: [
        {
          instructionType: {
            destAcctType: 1,
            amountType: 1,
          },
          amount: {
            amount: paymentData.transactionAmount,
            currencyCode: 'UGX',
          },
          sendFee: {
            amount: 1,
            currencyCode: 'UGX',
          },
          sender: {
            msisdn: null,
            fromCountry: 'GB',
            name: 'Wys',
            surname: 'Katlego',
            address: null,
            city: null,
            state: null,
            postalCode: null,
            email: null,
            dateOfBirth: null,
            document: null,
          },
          recipient: {
            msisdn: null,
            toCountry: 'UG',
            name: 'Gg',
            surname: 'Lebese',
            address: null,
            city: null,
            state: null,
            postalCode: null,
            email: null,
            dateOfBirth: null,
            document: null,
            destinationAccount: null,
          },
          thirdPartyTransId: 'MFS11',
          reference: uniqueKey,
        },
      ],
    };

    console.log('payload', payload);
    return payload;
  }

  public async sendPaymentPerPa(
    payload: OnafriqTransferPayloadDto,
    referenceId: string,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FinancialServiceProviderName.onafriq;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.requestBody[0].amount.amount;

    const result = await this.onafriqApiService.transfer(payload);

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

  public async processOnafriqRequest(
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

    const onafriqCustomData = { ...paymentRequestResultPerPa.customData };

    payloadResult.requestResult = onafriqCustomData.requestResult;
    payloadResult.transaction = transaction;
    await this.onafriqRequestRepository.save(payloadResult);
  }

  public async processOnafriqResult(
    onafriqPaymentResultData: any,
    attempt = 1,
  ): Promise<void> {
    const onafriqDbRequest = await this.onafriqRequestRepository
      .createQueryBuilder('onafriq_request')
      .leftJoinAndSelect('onafriq_request.transaction', 'transaction')
      .getMany();
    if (onafriqDbRequest[0] === undefined && attempt <= 3) {
      attempt++;
      await waitFor(850);
      await this.processOnafriqResult(onafriqPaymentResultData, attempt);
      return;
    }

    let paymentStatus = null;

    if (
      onafriqPaymentResultData &&
      onafriqPaymentResultData.Result &&
      onafriqPaymentResultData.Result.ResultCode === 0
    ) {
      paymentStatus = StatusEnum.success;
    } else {
      paymentStatus = StatusEnum.error;
      onafriqDbRequest[0].transaction.errorMessage =
        onafriqPaymentResultData.Result.ResultDesc;
    }

    onafriqDbRequest[0].status = paymentStatus;
    onafriqDbRequest[0].paymentResult = onafriqPaymentResultData;

    const onafriqCustomData = {
      ...onafriqDbRequest[0].transaction.customData,
    };
    onafriqCustomData['paymentResult'] = onafriqPaymentResultData;
    onafriqDbRequest[0].transaction.status = paymentStatus;
    onafriqDbRequest[0].transaction.customData = onafriqCustomData;

    await this.onafriqRequestRepository.save(onafriqDbRequest);
    await this.transactionRepository.save(onafriqDbRequest[0].transaction);
  }

  private generateMfsSign(
    password: string,
    batchId: string,
    uniqueKey: string,
  ): string {
    const data = password + batchId + uniqueKey;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
