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
import { BelcashApiService } from './belcash.api.service';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { BelcashTransferPayload } from './belcash-transfer-payload.dto';
import { BelcashPaymentStatusDto } from './dto/belcash-payment-status.dto';
import { BelcashRequestEntity } from './belcash-request.entity';

@Injectable()
export class BelcashService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(BelcashRequestEntity)
  private readonly belcashRequestRepository: Repository<BelcashRequestEntity>;

  public constructor(
    private readonly belcashApiService: BelcashApiService,
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
    fspTransactionResult.fspName = FspName.belcash;

    const program = await this.programRepository.findOne(programId);

    const authorizationToken = await this.belcashApiService.authenticate();

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
    }
    this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      programId,
      paymentNr,
    );

    return fspTransactionResult;
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    paymentNr: number,
    amount: number,
    currency: string,
    programId: number,
  ): BelcashTransferPayload {
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
      notifyto: false,
      notifyfrom: false,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: BelcashTransferPayload,
    referenceId: string,
    authorizationToken: string,
  ): Promise<PaTransactionResultDto> {
    // A timeout of 100ms to not overload belcash server
    await new Promise(r => setTimeout(r, 100));

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.belcash;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.amount;

    const result = await this.belcashApiService.transfer(
      payload,
      authorizationToken,
    );

    if ([200, 201].includes(result.status)) {
      paTransactionResult.status = StatusEnum.waiting;
      paTransactionResult.message =
        'Payment request sent succesfully. Awaiting status update.';
    } else {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.data.error.message;
    }
    return paTransactionResult;
  }

  public async processTransactionStatus(
    belcashCallbackData: BelcashPaymentStatusDto,
  ): Promise<void> {
    const belcashRequest = await this.belcashRequestRepository.save(
      belcashCallbackData,
    );

    const successStatuses = ['PROCESSED'];
    const errorStatuses = ['CANCELED', 'EXPIRED', 'DENIED', 'FAILED'];

    if (
      [...successStatuses, ...errorStatuses].includes(belcashRequest.status)
    ) {
      // Unclear as of yet when which attribute is returned, but we pass equal values to both attributes
      const matchingString =
        belcashRequest.referenceid || belcashRequest.tracenumber;

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
      paTransactionResult.fspName = FspName.belcash;
      paTransactionResult.referenceId = referenceId;
      paTransactionResult.status = successStatuses.includes(
        belcashRequest.status,
      )
        ? StatusEnum.success
        : StatusEnum.error;
      paTransactionResult.message = '';
      paTransactionResult.calculatedAmount = Number(belcashRequest.amount);

      this.transactionsService.storeTransaction(
        paTransactionResult,
        programId,
        payment,
      );
    }
  }
}
