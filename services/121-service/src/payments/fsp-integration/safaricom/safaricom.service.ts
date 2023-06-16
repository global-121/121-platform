import { Injectable } from '@nestjs/common';
// import { SafaricomPaymentPayloadDto } from './dto/safaricom-payment-payload.dto';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';

@Injectable()
export class SafaricomService {
  public constructor(
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

    for (const payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);

      const paTransactionResult = {
        fspName: FspName.safaricom,
        referenceId: payment.referenceId,
        date: new Date(),
        calculatedAmount: calculatedAmount,
        status: StatusEnum.waiting,
        message: null,
      };

      // Storing the per payment so you can continiously seed updates of transactions in HO-Portal
      this.transactionsService.storeTransactionUpdateStatus(
        paTransactionResult,
        programId,
        paymentNr,
      );
    }
    return fspTransactionResult;
  }
}
