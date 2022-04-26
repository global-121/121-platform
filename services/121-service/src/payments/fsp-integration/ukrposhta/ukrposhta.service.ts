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
    ukrPoshtaFspInstructions.Amount = transaction.amount;
    ukrPoshtaFspInstructions['Transfer costs'] = null;
    if (registration.customData[CustomDataAttributes.name]) {
      ukrPoshtaFspInstructions['Last name'] =
        registration.customData[CustomDataAttributes.name];
      ukrPoshtaFspInstructions['First name'] = null;
      ukrPoshtaFspInstructions['Middle name'] = null;
    } else {
      ukrPoshtaFspInstructions['Last name'] =
        registration.customData[CustomDataAttributes.lastName];
      ukrPoshtaFspInstructions['First name'] =
        registration.customData[CustomDataAttributes.firstName];
      ukrPoshtaFspInstructions['Middle name'] =
        registration.customData[CustomDataAttributes.fathersName];
    }
    ukrPoshtaFspInstructions['Country'] = 'Україна';
    if (registration.customData[CustomDataAttributes.address]) {
      // PA of first iteration, only has 1 address field
      ukrPoshtaFspInstructions['Postal index'] = null;
      ukrPoshtaFspInstructions['Oblast'] =
        registration.customData[CustomDataAttributes.oblast];
      ukrPoshtaFspInstructions['Rayon'] =
        registration.customData[CustomDataAttributes.raion];
      ukrPoshtaFspInstructions['City'] =
        registration.customData[CustomDataAttributes.address];
      ukrPoshtaFspInstructions['Street'] = null;
      ukrPoshtaFspInstructions['Apartment/Office'] = null;
    }
    if (registration.customData[CustomDataAttributes.addressNoPostalIndex]) {
      // PA of second iteration, only has an address field (no postal index) & postal index field
      ukrPoshtaFspInstructions['Postal index'] =
        registration.customData[CustomDataAttributes.postalIndex];
      ukrPoshtaFspInstructions['Oblast'] =
        registration.customData[CustomDataAttributes.oblast];
      ukrPoshtaFspInstructions['Rayon'] =
        registration.customData[CustomDataAttributes.raion];
      ukrPoshtaFspInstructions['City'] =
        registration.customData[CustomDataAttributes.addressNoPostalIndex];
      ukrPoshtaFspInstructions['Street'] = null;
      ukrPoshtaFspInstructions['Apartment/Office'] = null;
    }
    if (registration.customData[CustomDataAttributes.city]) {
      // PA of third iteration, has all address information in seperate fields
      ukrPoshtaFspInstructions['Postal index'] =
        registration.customData[CustomDataAttributes.postalIndex];
      ukrPoshtaFspInstructions['Oblast'] =
        registration.customData[CustomDataAttributes.oblast];
      ukrPoshtaFspInstructions['Rayon'] =
        registration.customData[CustomDataAttributes.raion];
      ukrPoshtaFspInstructions['City'] =
        registration.customData[CustomDataAttributes.city];
      ukrPoshtaFspInstructions['Street'] =
        registration.customData[CustomDataAttributes.street];
      ukrPoshtaFspInstructions['Apartment/Office'] =
        registration.customData[CustomDataAttributes.apartmentOrOffice];
    }
    ukrPoshtaFspInstructions['Special notes'] = 'без повідомлення';
    ukrPoshtaFspInstructions['Email'] = null;
    ukrPoshtaFspInstructions['Telephone'] = this.formatPhoneNumber(
      registration.customData[CustomDataAttributes.phoneNumber],
    );
    ukrPoshtaFspInstructions['Tax ID number'] =
      registration.customData[CustomDataAttributes.taxId];

    return ukrPoshtaFspInstructions;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const countryCodePart = phoneNumber.slice(0, 2);
    const parenthesisPart = phoneNumber.slice(2, 5);
    const trailingPart1 = phoneNumber.slice(5, 8);
    const trailingPart2 = phoneNumber.slice(8, 10);
    const trailingPart3 = phoneNumber.slice(10, 12);
    return `+${countryCodePart}(${parenthesisPart})${trailingPart1}-${trailingPart2}-${trailingPart3}`;
  }
}
