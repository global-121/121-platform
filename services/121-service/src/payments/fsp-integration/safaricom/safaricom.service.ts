import { EXTERNAL_API } from '@121-service/src/config';
import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import {
  SafaricomTransferPayload,
  SafaricomTransferPayloadParams,
} from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer-payload.interface';
import { SafaricomTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer.interface';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-request.entity';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { generateRandomString } from '@121-service/src/utils/getRandomValue.helper';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SafaricomService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(SafaricomTransferEntity)
  private readonly safaricomTransferRepository: Repository<SafaricomTransferEntity>;
  // @InjectRepository(TransactionEntity)
  // private readonly transactionRepository: Repository<TransactionEntity>;
  // @InjectRepository(RegistrationEntity)
  // private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    // private readonly transactionsService: TransactionsService,
    // @InjectQueue(QueueNamePayment.paymentSafaricom)
    // private readonly paymentSafaricomQueue: Queue,
    // @Inject(REDIS_CLIENT)
    // private readonly redisClient: Redis,
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
    // for (const paPaymentData of paymentList) {
    //   const jobData: SafaricomJobDto = {
    //     paPaymentData: paPaymentData,
    //     programId: programId,
    //     paymentNr: paymentNr,
    //     userId: paPaymentData.userId,
    //   };
    //   const job = await this.paymentSafaricomQueue.add(
    //     ProcessNamePayment.sendPayment,
    //     jobData,
    //   );
    //   await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    // }

    throw new Error('Method should not be called anymore.');
  }

  public async doTransfer(
    transferData: SafaricomTransferParams,
  ): Promise<PaTransactionResultDto> {
    await this.safaricomApiService.authenticate();

    // TODO: get this data before queueing in payments.service
    // const registrationData = await this.getRegistrationProgramIdAndNationalId(
    //   transferData.referenceId,
    // );

    // const nationalId = registrationData?.nationalId;
    // const registrationProgramId = registrationData?.registrationProgramId;

    // TODO: simplify input
    const payload = this.createPayloadPerPa(
      transferData.programId,
      transferData.paymentNr,
      transferData.transactionAmount,
      transferData.phoneNumber,
      transferData.referenceId,
      transferData.nationalId,
      transferData.registrationProgramId,
    );

    // TODO: change return type to safaricom-specific interface instead of generic PaTransactionResultDto
    return await this.sendPaymentPerPa(payload, transferData.referenceId);

    // const transactionRelationDetails = {
    //   programId: transferData.programId,
    //   paymentNr: transferData.paymentNr,
    //   userId: transferData.userId,
    // };
    // // Storing the per payment so you can continiously seed updates of transactions in Portal
    // const transaction =
    //   await this.transactionsService.storeTransactionUpdateStatus(
    //     paymentRequestResultPerPa,
    //     transactionRelationDetails,
    //   );

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
    // paymentData: PaPaymentDataDto,
    programId: number,
    paymentNr: number,
    transactionAmount: number,
    phoneNumber: string,
    referenceId: string,
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
      Amount: transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A!,
      PartyB: phoneNumber,
      Remarks: `Payment ${paymentNr}`,
      QueueTimeOutURL: EXTERNAL_API.safaricomQueueTimeoutUrl,
      ResultURL: EXTERNAL_API.safaricomResultUrl,
      Occassion: referenceId,
      OriginatorConversationID: `P${programId}PA${registrationProgramId}_${formatDate(
        new Date(),
      )}_${generateRandomString(3)}`,
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: nationalId,
    };
  }

  public async sendPaymentPerPa(
    payload: SafaricomTransferPayloadParams,
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
    } else {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.errorMessage;
    }

    paTransactionResult.customData = {
      requestResult: result,
    };
    return paTransactionResult;
  }

  public async createAndSaveSafaricomTransferData(
    safaricomDoTransferResult: PaTransactionResultDto,
    transaction: TransactionEntity,
  ): Promise<any> {
    const safaricomTransferEntity = new SafaricomTransferEntity();

    const safaricomCustomData = { ...safaricomDoTransferResult.customData };
    safaricomTransferEntity.mpesaConversationId =
      safaricomCustomData &&
      safaricomCustomData.requestResult &&
      safaricomCustomData.requestResult.ConversationID
        ? safaricomCustomData.requestResult.ConversationID
        : 'Invalid Request';

    safaricomTransferEntity.mpesaTransactionId = transaction;
    safaricomTransferEntity.originatorConversationID = ''; //TODO: no idea how should get it

    await this.safaricomTransferRepository.save(safaricomTransferEntity);
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
