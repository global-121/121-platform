import { Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';

@Injectable()
export class BobFinanceService {
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  // NOTE: ALL BELOW IS COPIED FROM AFRICAS-TALKING. THIS MUST BE ADJUSTED TO BELCASH STILL.

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.bobFinance;
    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = calculatedAmount;
      transactionResult.fspName = FspName.bobFinance;
      transactionResult.referenceId = payment.referenceId;
      transactionResult.status = StatusEnum.success;
      fspTransactionResult.paList.push(transactionResult);
    }
    await this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      programId,
      paymentNr,
    );

    return fspTransactionResult;
  }
}
