import { Injectable } from '@nestjs/common';
// import { SafaricomPaymentPayloadDto } from './dto/safaricom-payment-payload.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EXTERNAL_API } from '../../../config';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../../payments/dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../../payments/transactions/transaction.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { SafaricomTransferPayload } from './dto/safaricom-transfer-payload.dto';
import { SafaricomRequestEntity } from './safaricom-request.entity';
import { SafaricomApiService } from './safaricom.api.service';

@Injectable()
export class SafaricomService {
  @InjectRepository(SafaricomRequestEntity)
  private readonly safaricomRequestRepository: Repository<SafaricomRequestEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.safaricom;

    const referenceIds = paymentList.map((payment) => payment.referenceId);
    const userInfo = await this.getUserInfo(referenceIds);

    for (const payment of paymentList) {
      await this.safaricomApiService.authenticate();
      const resultUser = userInfo.find(
        (user) => user.referenceId == payment.referenceId,
      );

      const payload = this.createPayloadPerPa(
        payment,
        programId,
        paymentNr,
        resultUser,
      );

      const paymentRequestResultPerPa = await this.sendPaymentPerPa(
        payload,
        payment.referenceId,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
      // Storing the per payment so you can continiously seed updates of transactions in HO-Portal
      await this.transactionsService.storeTransactionUpdateStatus(
        paymentRequestResultPerPa,
        programId,
        paymentNr,
      );

      await this.processSafaricomRequest(payload, paymentRequestResultPerPa);
    }
    return fspTransactionResult;
  }

  public async getUserInfo(
    referenceIds: string[],
  ): Promise<{ id: string; referenceId: string; value: string }[]> {
    return await this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        'registration.id AS id',
        'registration.referenceId AS "referenceId"',
        'data.value AS value',
      ])
      .where('registration.referenceId IN (:...referenceIds)', {
        referenceIds: referenceIds,
      })
      .andWhere('fspQuestion.name IN (:...names)', {
        names: ['nationalId'],
      })
      .leftJoin('registration.data', 'data')
      .leftJoin('data.fspQuestion', 'fspQuestion')
      .getRawMany();
  }

  public createPayloadPerPa(
    payment,
    programId,
    paymentNr,
    userInfo: { id: string; referenceId: string; value: string },
  ): SafaricomTransferPayload {
    function padTo2Digits(num: number): string {
      return num.toString().padStart(2, '0');
    }

    function formatDate(date: Date): string {
      return (
        [
          date.getFullYear().toString().substring(2),
          padTo2Digits(date.getMonth() + 1),
          padTo2Digits(date.getDate()),
        ].join('') +
        '' +
        [
          padTo2Digits(date.getHours()),
          padTo2Digits(date.getMinutes()),
          padTo2Digits(date.getSeconds()),
        ].join('')
      );
    }

    const payload = {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: payment.transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A,
      PartyB: payment.paymentAddress,
      Remarks: `Payment ${paymentNr}`,
      QueueTimeOutURL: EXTERNAL_API.safaricomQueueTimeoutUrl,
      ResultURL: EXTERNAL_API.safaricomResultUrl,
      Occassion: payment.referenceId,
      OriginatorConversationID: `P${programId}_PA${userInfo.id}_${formatDate(
        new Date(),
      )}`,
      IDType: process.env.SAFARICOM_IDTYPE,
      IDNumber: userInfo.value,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: any,
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
  ): Promise<any> {
    const payloadResult = Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [
        k.charAt(0).toLowerCase() + k.slice(1),
        v,
      ]),
    );

    const safaricomCustomData = { ...paymentRequestResultPerPa.customData };
    const transaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.customData ::jsonb @> :customData', {
        customData: {
          requestResult: {
            OriginatorConversationID:
              safaricomCustomData.requestResult.OriginatorConversationID,
          },
        },
      })
      .getMany();

    payloadResult.requestResult = safaricomCustomData.requestResult;
    payloadResult.conversationID =
      safaricomCustomData &&
      safaricomCustomData.requestResult &&
      safaricomCustomData.requestResult.ConversationID
        ? safaricomCustomData.requestResult.ConversationID
        : 'Invalid Request';
    payloadResult.transaction = transaction[0];
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
      await new Promise((resolve) => setTimeout(resolve, 850));
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
