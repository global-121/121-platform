import { Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { CustomDataAttributes } from '../../../registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '../../../registration/enum/registration-status.enum';
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

    // These conditional statements are in here because we needed to change FSP questions during an in progress program.
    if (registration.customData[CustomDataAttributes.postalIndex]) {
      ukrPoshtaFspInstructions['Oblast / Rayon / city / street / house'] =
        registration.customData[CustomDataAttributes.address];
      ukrPoshtaFspInstructions['Postal index'] =
        registration.customData[CustomDataAttributes.postalIndex];
      ukrPoshtaFspInstructions[
        'Oblast / Rayon / city / street / house / postal index'
      ] = null;
    } else {
      ukrPoshtaFspInstructions[
        'Oblast / Rayon / city / street / house / postal index'
      ] = registration.customData[CustomDataAttributes.address];
      ukrPoshtaFspInstructions['Oblast / Rayon / city / street / house'] = null;
      ukrPoshtaFspInstructions['Postal index'] = null;
    }

    if (registration.customData[CustomDataAttributes.name]) {
      ukrPoshtaFspInstructions['Name / last name / fathers name'] =
        registration.customData[CustomDataAttributes.name];
      ukrPoshtaFspInstructions['Name'] = null;
      ukrPoshtaFspInstructions['Last name'] = null;
      ukrPoshtaFspInstructions['Fathers name'] = null;
    }
    if (
      registration.customData[CustomDataAttributes.firstName] &&
      registration.customData[CustomDataAttributes.lastName] &&
      registration.customData[CustomDataAttributes.fathersName]
    ) {
      ukrPoshtaFspInstructions['Name / last name / fathers name'] = null;
      ukrPoshtaFspInstructions['Name'] =
        registration.customData[CustomDataAttributes.firstName];
      ukrPoshtaFspInstructions['Last name'] =
        registration.customData[CustomDataAttributes.lastName];
      ukrPoshtaFspInstructions['Fathers name'] =
        registration.customData[CustomDataAttributes.fathersName];
    }

    ukrPoshtaFspInstructions.Amount = transaction.amount;
    ukrPoshtaFspInstructions['Tax ID number'] =
      registration.customData[CustomDataAttributes.taxId];
    ukrPoshtaFspInstructions['Transfer costs'] = null;
    ukrPoshtaFspInstructions['Transfer track no (Dorcas database no)'] = null;
    ukrPoshtaFspInstructions['Telephone'] =
      registration.customData[CustomDataAttributes.phoneNumber];

    return ukrPoshtaFspInstructions;
  }
}
