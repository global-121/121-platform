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

    // These conditional statements are in here because we needed to change FSP questions during an in progress program.
    ukrPoshtaFspInstructions.Amount = transaction.amount;
    ukrPoshtaFspInstructions['Transfer costs'] = null;
    if (
      await registration.getRegistrationDataValueByName(
        CustomDataAttributes.name,
      )
    ) {
      ukrPoshtaFspInstructions[
        'Last name'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.name,
      );
      ukrPoshtaFspInstructions['First name'] = null;
      ukrPoshtaFspInstructions['Middle name'] = null;
    } else {
      ukrPoshtaFspInstructions[
        'Last name'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.lastName,
      );
      ukrPoshtaFspInstructions[
        'First name'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.firstName,
      );
      ukrPoshtaFspInstructions[
        'Middle name'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.fathersName,
      );
    }
    ukrPoshtaFspInstructions['Country'] = 'Україна';
    if (
      await registration.getRegistrationDataValueByName(
        CustomDataAttributes.address,
      )
    ) {
      // PA of first iteration, only has 1 address field
      ukrPoshtaFspInstructions['Postal index'] = null;
      ukrPoshtaFspInstructions[
        'Oblast'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.oblast,
      );
      ukrPoshtaFspInstructions[
        'Raion'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.raion,
      );
      ukrPoshtaFspInstructions[
        'City'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.address,
      );
      ukrPoshtaFspInstructions['Street'] = null;
      ukrPoshtaFspInstructions['House number'] = null;
      ukrPoshtaFspInstructions['Apartment/Office'] = null;
    }
    if (
      await registration.getRegistrationDataValueByName(
        CustomDataAttributes.addressNoPostalIndex,
      )
    ) {
      // PA of second iteration, only has an address field (no postal index) & postal index field
      ukrPoshtaFspInstructions[
        'Postal index'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.postalIndex,
      );
      ukrPoshtaFspInstructions[
        'Oblast'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.oblast,
      );
      ukrPoshtaFspInstructions[
        'Raion'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.raion,
      );
      ukrPoshtaFspInstructions[
        'City'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.addressNoPostalIndex,
      );
      ukrPoshtaFspInstructions['Street'] = null;
      ukrPoshtaFspInstructions['House number'] = null;
      ukrPoshtaFspInstructions['Apartment/Office'] = null;
    }
    if (
      await registration.getRegistrationDataValueByName(
        CustomDataAttributes.city,
      )
    ) {
      // PA of third iteration, has all address information in seperate fields
      ukrPoshtaFspInstructions[
        'Postal index'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.postalIndex,
      );
      ukrPoshtaFspInstructions[
        'Oblast'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.oblast,
      );
      ukrPoshtaFspInstructions[
        'Raion'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.raion,
      );
      ukrPoshtaFspInstructions[
        'City'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.city,
      );
      ukrPoshtaFspInstructions[
        'Street'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.street,
      );
      ukrPoshtaFspInstructions[
        'House number'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.house,
      );
      ukrPoshtaFspInstructions[
        'Apartment/Office'
      ] = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.apartmentOrOffice,
      );
    }
    ukrPoshtaFspInstructions['Special notes'] = 'без повідомлення';
    ukrPoshtaFspInstructions['Email'] = null;
    ukrPoshtaFspInstructions['Telephone'] = this.formatPhoneNumber(
      await registration.getRegistrationDataValueByName(
        CustomDataAttributes.phoneNumber,
      ),
    );
    ukrPoshtaFspInstructions[
      'Tax ID number'
    ] = await registration.getRegistrationDataValueByName(
      CustomDataAttributes.taxId,
    );

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
