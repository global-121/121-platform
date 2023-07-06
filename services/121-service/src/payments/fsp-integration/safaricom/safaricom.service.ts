import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
// import { SafaricomPaymentPayloadDto } from './dto/safaricom-payment-payload.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../../payments/dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../../payments/transactions/transaction.entity';
import { RegistrationDataEntity } from '../../../registration/registration-data.entity';
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
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationDataEntity)
  private readonly registrationDataRepository: Repository<RegistrationDataEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

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

    await this.safaricomApiService.authenticate();

    for (const payment of paymentList) {
      const payload = this.createPayloadPerPa(payment, paymentNr);

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

  public createPayloadPerPa(payment, paymentNr): SafaricomTransferPayload {
    function randomValueHex(len: number): string {
      return crypto
        .randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len)
        .toUpperCase(); // return required number of characters
    }

    const payload = {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: payment.transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A,
      PartyB: payment.paymentAddress,
      Remarks: `Payment ${paymentNr}`,
      QueueTimeOutURL: process.env.SAFARICOM_QUEUETIMEOUT_URL,
      ResultURL: process.env.SAFARICOM_RESULT_URL,
      Occassion: payment.referenceId,
      OriginatorConversationID: `232323_KCBOrg_${randomValueHex(20)}`,
      IDType: process.env.SAFARICOM_IDTYPE,
      IDNumber: '123789',
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: any,
    referenceId: string,
  ): Promise<PaTransactionResultDto> {
    // A timeout of 100ms to not overload safaricom server
    await new Promise((r) => setTimeout(r, 2000));

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
            ConversationID: safaricomCustomData.requestResult.ConversationID,
          },
        },
      })
      .getMany();

    payloadResult.requestResult = safaricomCustomData.requestResult;
    payloadResult.conversationID =
      safaricomCustomData && safaricomCustomData.requestResult
        ? safaricomCustomData.requestResult.ConversationID
        : 'Invalid request';
    payloadResult.transaction = transaction[0];
    await this.safaricomRequestRepository.save(payloadResult);
  }

  public async processSafaricomResult(
    safaricomPaymentResultData: any,
  ): Promise<void> {
    const safaricomDbRequest = await this.safaricomRequestRepository
      .createQueryBuilder('safaricom_request')
      .where('safaricom_request.requestResult ::jsonb @> :requestResult', {
        requestResult: {
          ConversationID: safaricomPaymentResultData.Result.ConversationID,
        },
      })
      .getMany();

    const transaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.customData ::jsonb @> :customData', {
        customData: {
          requestResult: {
            ConversationID: safaricomPaymentResultData.Result.ConversationID,
          },
        },
      })
      .getMany();

    if (
      safaricomPaymentResultData &&
      safaricomPaymentResultData.Result &&
      safaricomPaymentResultData.Result.ResultCode === 0
    ) {
      safaricomDbRequest[0].status = StatusEnum.success;
      transaction[0].status = StatusEnum.success;
    } else {
      safaricomDbRequest[0].status = StatusEnum.error;
      transaction[0].status = StatusEnum.error;
    }

    safaricomDbRequest[0].paymentResult = safaricomPaymentResultData;
    const safaricomCustomData = { ...transaction[0].customData };
    safaricomCustomData['paymentResult'] = safaricomPaymentResultData;

    await this.transactionRepository
      .createQueryBuilder('transaction')
      .update('transaction')
      .set({
        errorMessage: safaricomPaymentResultData.Result.ResultDesc,
        status: transaction[0].status,
        customData: safaricomCustomData,
      })
      .where('id = :id', { id: transaction[0].id })
      .execute();

    await this.safaricomRequestRepository.save(safaricomDbRequest);
  }
}
