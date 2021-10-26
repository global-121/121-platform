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
@Injectable()
export class BelcashService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
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
  ): object {
    const payload = {
      amount: amount,
      to: `+${paymentData.paymentAddress}`,
      currency: currency,
      referenceid: `${
        paymentData.referenceId
      }-payment-${paymentNr}-${+new Date()}`,
      notifyto: true,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: any,
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

    if (result.status !== 200 || result.status !== 201) {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.data.error.message;
    } else {
      paTransactionResult.status = StatusEnum.success;
      paTransactionResult.message = 'Payment instructions succesfully send.';
    }
    return paTransactionResult;
  }
}
