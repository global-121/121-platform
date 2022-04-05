import { Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { LookupService } from '../../../notifications/lookup/lookup.service';
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
import { UkrPoshtaFspInstructions } from './dto/ukrposhta-fsp-instructions.dto';

@Injectable()
export class UkrPoshtaService {
  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly lookupService: LookupService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.ukrPoshta;
    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = calculatedAmount;
      transactionResult.fspName = FspName.ukrPoshta;
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

  public async getFspInstructions(
    registration: RegistrationEntity,
    transaction: TransactionEntity,
  ): Promise<UkrPoshtaFspInstructions> {
    const ukrPoshtaFspInstructions = new UkrPoshtaFspInstructions();

    ukrPoshtaFspInstructions[
      'Oblast / Rayon / city / street / house / postal index'
    ] = registration.customData[CustomDataAttributes.address];
    ukrPoshtaFspInstructions['Name / last name / fathers name'] =
      registration.customData[CustomDataAttributes.name];
    ukrPoshtaFspInstructions.Amount = transaction.amount;
    ukrPoshtaFspInstructions['Tax ID number'] =
      registration.customData[CustomDataAttributes.taxId];
    ukrPoshtaFspInstructions['Transfer costs'] = null;
    ukrPoshtaFspInstructions['Transfer track no (Dorcas database no)'] = null;
    ukrPoshtaFspInstructions['Telephone'] = await this.formatToLocalNumber(
      registration.customData[CustomDataAttributes.phoneNumber],
    );

    return ukrPoshtaFspInstructions;
  }

  private async formatToLocalNumber(phonenumber: string): Promise<number> {
    return await this.lookupService.getLocalNumber(`+${phonenumber}`);
  }
}
