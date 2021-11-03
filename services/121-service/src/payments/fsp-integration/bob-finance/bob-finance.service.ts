import { Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { CustomDataAttributes } from '../../../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import {
  BobFinanceFspInstructions,
  BobFinanceFspInstructionsEnum,
} from './dto/bob-finance-fsp-instructions.dto';

@Injectable()
export class BobFinanceService {
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

  public getFspInstructions(
    registration: RegistrationEntity,
    transaction: TransactionEntity,
  ): BobFinanceFspInstructions {
    const bobFinanceFspInstructions = new BobFinanceFspInstructions();
    bobFinanceFspInstructions[BobFinanceFspInstructionsEnum.receiverFirstName] =
      registration.customData[CustomDataAttributes.nameFirst];
    bobFinanceFspInstructions[BobFinanceFspInstructionsEnum.receiverLastName] =
      registration.customData[CustomDataAttributes.nameLast];
    bobFinanceFspInstructions[BobFinanceFspInstructionsEnum.mobileNumber] =
      registration.customData[CustomDataAttributes.phoneNumber];
    bobFinanceFspInstructions[BobFinanceFspInstructionsEnum.email] = null;
    bobFinanceFspInstructions[BobFinanceFspInstructionsEnum.amount] =
      transaction.amount;
    bobFinanceFspInstructions[BobFinanceFspInstructionsEnum.currency] = 'LBP';
    bobFinanceFspInstructions[BobFinanceFspInstructionsEnum.expiryDate] = null;

    return bobFinanceFspInstructions;
  }
}
