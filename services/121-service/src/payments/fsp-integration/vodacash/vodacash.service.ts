import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { VodacashApiService } from './vodacash.api.service';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { VodacashTransferPayload } from './vodacash-transfer-payload.dto';
import { VodacashRequestEntity } from './vodacash.request.entity';
import { VodacashPaymentStatusDto } from './dto/vodacash-payment-status.dto';

@Injectable()
export class VodacashService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(VodacashRequestEntity)
  private readonly vodacashRequestRepository: Repository<VodacashRequestEntity>;

  public constructor(
    private readonly vodacashApiService: VodacashApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    console.log('VODACASH PAYMENT');
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.vodacash;

    const program = await this.programRepository.findOne(programId);

    const authorizationToken = await this.vodacashApiService.authenticate();

    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const payload = this.createPayloadPerPa(
        payment,
        paymentNr,
        calculatedAmount,
        program.currency,
        program.id,
      );

      const paymentRequestResultPerPa = await this.sendPaymentPerPa(
        payload,
        payment.referenceId,
        authorizationToken,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
      // Storing the per payment so you can continiously seed updates of transactions in HO-Portal
      this.transactionsService.storeTransaction(
        paymentRequestResultPerPa,
        programId,
        paymentNr,
      );
    }

    return fspTransactionResult;
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    paymentNr: number,
    amount: number,
    currency: string,
    programId: number,
  ): VodacashTransferPayload {
    const payload = {
      amount: amount,
      to: `+${paymentData.paymentAddress}`,
      currency: currency,
      description: `121 program: payment ${paymentNr}`,
      tracenumber: `referenceId-${
        paymentData.referenceId
      }_program-${programId}_payment-${paymentNr}_timestamp-${+new Date()}`,
      referenceid: `referenceId-${
        paymentData.referenceId
      }_program-${programId}_payment-${paymentNr}_timestamp-${+new Date()}`,
      notifyto: true,
      notifyfrom: false,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: VodacashTransferPayload,
    referenceId: string,
    authorizationToken: string,
  ): Promise<PaTransactionResultDto> {
    // A timeout of 100ms to not overload vodacash server
    await new Promise(r => setTimeout(r, 2000));

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.vodacash;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.amount;

    const result = await this.vodacashApiService.transfer(
      payload,
      authorizationToken,
    );

    if ([200, 201].includes(result.status)) {
      paTransactionResult.status = StatusEnum.success;
    } else {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.data.error.message;
    }
    return paTransactionResult;
  }

  public async processTransactionStatus(
    vodacashCallbackData: VodacashPaymentStatusDto,
  ): Promise<void> {
    const vodacashRequest = await this.vodacashRequestRepository.save(
      vodacashCallbackData,
    );

    const successStatuses = ['PROCESSED'];
    const errorStatuses = ['CANCELED', 'EXPIRED', 'DENIED', 'FAILED'];

    if (
      [...successStatuses, ...errorStatuses].includes(vodacashRequest.status)
    ) {
      // Unclear as of yet when which attribute is returned, but we pass equal values to both attributes
      const matchingString =
        vodacashRequest.referenceid || vodacashRequest.tracenumber;

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
        paTransactionResult.fspName = FspName.vodacash;
        paTransactionResult.referenceId = referenceId;
        paTransactionResult.status = successStatuses.includes(
          vodacashRequest.status,
        )
          ? StatusEnum.success
          : StatusEnum.error;
        paTransactionResult.message = vodacashRequest.status;
        paTransactionResult.calculatedAmount = Number(vodacashRequest.amount);

        this.transactionsService.storeTransaction(
          paTransactionResult,
          programId,
          payment,
        );
      }
    }
  }
}
