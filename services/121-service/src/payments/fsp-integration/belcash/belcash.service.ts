import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { FspTransactionResultDto } from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { BelcashApiService } from './belcash.api.service';

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

    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const payload = this.createPayloadPerPa(
        payment,
        paymentNr,
        calculatedAmount,
        program.currency,
      );

      const paymentRequestResultPerPa = await this.belcashApiService.sendPaymentPerPa(
        payload,
        payment.referenceId,
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
      description: 'Test description',
      currency: currency,
      referenceid: `${paymentData.referenceId}-payment-${paymentNr}`,
      tracenumber: 'abc',
      notifyfrom: true,
      notifyto: true,
    };

    return payload;
  }
}
