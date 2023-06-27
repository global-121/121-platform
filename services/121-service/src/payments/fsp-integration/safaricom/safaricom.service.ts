import { Injectable } from '@nestjs/common';
// import { SafaricomPaymentPayloadDto } from './dto/safaricom-payment-payload.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../../payments/dto/payment-transaction-result.dto';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { SafaricomPaymentStatusDto } from './dto/safaricom-payment-status.dto';
import { SafaricomTransferPayload } from './dto/safaricom-transfer-payload.dto';
import { SafaricomRequestEntity } from './safaricom-request.entity';
import { SafaricomApiService } from './safaricom.api.service';

@Injectable()
export class SafaricomService {
  @InjectRepository(SafaricomRequestEntity)
  private readonly safaricomRequestRepository: Repository<SafaricomRequestEntity>;

  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.vodacash;

    const authorizationToken = await this.safaricomApiService.authenticate();

    for (const payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const payload = this.createPayloadPerPa(calculatedAmount);

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

  public createPayloadPerPa(calculatedAmount): SafaricomTransferPayload {
    const payload = {
      InitiatorName: 'John Doe',
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL,
      CommandID: 'SalaryPayment',
      Amount: calculatedAmount,
      PartyA: '123454',
      PartyB: '254722000000',
      Remarks: 'Payment 1',
      QueueTimeOutURL: 'https://darajambili.herokuapp.com/b2c/timeout',
      ResultURL: 'https://darajambili.herokuapp.com/b2c/result',
      Occassion: 'SalaryPayment',
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: SafaricomTransferPayload,
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

    console.log(paTransactionResult);
    if (result && result.ResponseCode === '0') {
      paTransactionResult.status = StatusEnum.success;
      paTransactionResult.message = result.ResponseDescription;
    } else {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.data.error.message;
    }
    console.log(paTransactionResult);
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
}
