import { Injectable } from '@nestjs/common';
// import { SafaricomPaymentPayloadDto } from './dto/safaricom-payment-payload.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../../payments/dto/payment-transaction-result.dto';
import { RegistrationDataEntity } from '../../../registration/registration-data.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { SafaricomPaymentStatusDto } from './dto/safaricom-payment-status.dto';
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

    const authorizationToken = await this.safaricomApiService.authenticate();

    for (const payment of paymentList) {
      const customer = await this.registrationRepository.find({
        where: { referenceId: payment.referenceId },
        select: { phoneNumber: true, id: true },
      });

      const customerData = await this.registrationDataRepository.find({
        where: { registrationId: customer[0].id, programQuestionId: 1 },
        select: { value: true },
      });

      const payload = this.createPayloadPerPa(
        payment,
        paymentNr,
        customer[0],
        customerData[0],
      );

      const paymentRequestResultPerPa = await this.sendPaymentPerPa(
        payload,
        payment.referenceId,
        authorizationToken,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
      // Storing the per payment so you can continiously seed updates of transactions in HO-Portal
      this.transactionsService.storeTransactionUpdateStatus(
        paymentRequestResultPerPa,
        programId,
        paymentNr,
      );
    }
    return fspTransactionResult;
  }

  public createPayloadPerPa(payment, paymentNr, customer, customerData): any {
    const payload = {
      InitiatorName: customerData.value || process.env.SAFARICOM_INITIATORNAME,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL,
      CommandID: 'SalaryPayment',
      Amount: payment.transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A,
      PartyB: customer.phoneNumber,
      Remarks: `Payment ${paymentNr}`,
      QueueTimeOutURL: process.env.SAFARICOM_QUEUETIMEOUT_URL,
      ResultURL: process.env.SAFARICOM_RESULT_URL,
      Occassion: payment.referenceId,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: any,
    referenceId: string,
    authorizationToken: string,
  ): Promise<PaTransactionResultDto> {
    // A timeout of 100ms to not overload safaricom server
    await new Promise((r) => setTimeout(r, 2000));

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.safaricom;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.Amount;

    const result = await this.safaricomApiService.transfer(
      payload,
      authorizationToken,
    );

    console.log(result);

    if (result && result.ResponseCode === '0') {
      paTransactionResult.status = StatusEnum.success;
      payload.status = StatusEnum.success;
      paTransactionResult.message = result.ResponseDescription;
    } else {
      paTransactionResult.status = StatusEnum.error;
      payload.status = StatusEnum.error;
      paTransactionResult.message = result.errorMessage;
    }
    const payloadResult = Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [
        k.charAt(0).toLowerCase() + k.slice(1),
        v,
      ]),
    );

    payloadResult.requestResult = result;
    await this.safaricomRequestRepository.save(payloadResult);
    return paTransactionResult;
  }

  public async processTransactionStatus(
    safaricomCallbackData: SafaricomPaymentStatusDto,
  ): Promise<void> {
    const safaricomRequest = await this.safaricomRequestRepository.save(
      safaricomCallbackData,
    );

    const successStatuses = ['PROCESSED'];
    const errorStatuses = ['CANCELED', 'EXPIRED', 'DENIED', 'FAILED'];

    if (
      [...successStatuses, ...errorStatuses].includes(safaricomRequest.status)
    ) {
      // Unclear as of yet when which attribute is returned, but we pass equal values to both attributes
      const matchingString =
        'ed15b1f7-c579-4a59-8224-56520cd3bdf7-payment-1-1636456825275';

      if (matchingString) {
        const referenceId = matchingString
          .split('_')[0]
          .replace('referenceId-', '');
        const programId = Number(
          matchingString.split('_')[1].replace('program-', ''),
        );
        const payment = Number(
          matchingString.split('_')[2].replace('payment-', ''),
        );

        const paTransactionResult = new PaTransactionResultDto();
        paTransactionResult.fspName = FspName.safaricom;
        paTransactionResult.referenceId = referenceId;
        paTransactionResult.status = successStatuses.includes(
          safaricomRequest.status,
        )
          ? StatusEnum.success
          : StatusEnum.error;
        paTransactionResult.message = safaricomRequest.status;
        paTransactionResult.calculatedAmount = Number(safaricomRequest.amount);

        this.transactionsService.storeTransactionUpdateStatus(
          paTransactionResult,
          programId,
          payment,
        );
      }
    }
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

    safaricomDbRequest[0].paymentResult = safaricomPaymentResultData;
    console.log(safaricomDbRequest);
    await this.safaricomRequestRepository.save(safaricomDbRequest);
  }
}
