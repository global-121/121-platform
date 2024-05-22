import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { UkrPoshtaFspInstructions } from '@121-service/src/payments/fsp-integration/ukrposhta/dto/ukrposhta-fsp-instructions.dto';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UkrPoshtaService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly registrationDataService: RegistrationDataService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FinancialServiceProviderName.ukrPoshta;
    for (const payment of paymentList) {
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = payment.transactionAmount;
      transactionResult.fspName = FinancialServiceProviderName.ukrPoshta;
      transactionResult.referenceId = payment.referenceId;
      transactionResult.status = StatusEnum.success;
      fspTransactionResult.paList.push(transactionResult);
    }
    const transactionRelationDetails: TransactionRelationDetailsDto = {
      programId,
      paymentNr,
      userId: paymentList[0].userId,
    };
    await this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      transactionRelationDetails,
    );

    return fspTransactionResult;
  }

  public async getQueueProgress(_programId: number): Promise<number> {
    // TODO: When this is implemented, remove the '_' from the variable. This is a temporary solution to avoid the linter error.
    throw new Error('Method not implemented.');
  }

  public async getFspInstructions(
    registration: RegistrationEntity,
    transaction: TransactionReturnDto,
  ): Promise<UkrPoshtaFspInstructions> {
    const ukrPoshtaFspInstructions = new UkrPoshtaFspInstructions();

    // These conditional statements are in here because we needed to change FSP questions during an in progress program.
    ukrPoshtaFspInstructions.Amount = transaction.amount;
    ukrPoshtaFspInstructions['Transfer costs'] = null;
    if (
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        CustomDataAttributes.name,
      )
    ) {
      ukrPoshtaFspInstructions['Last name'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.name,
        );
      ukrPoshtaFspInstructions['First name'] = null;
      ukrPoshtaFspInstructions['Middle name'] = null;
    } else {
      ukrPoshtaFspInstructions['Last name'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.lastName,
        );
      ukrPoshtaFspInstructions['First name'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.firstName,
        );
      ukrPoshtaFspInstructions['Middle name'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.fathersName,
        );
    }
    ukrPoshtaFspInstructions['Country'] = 'Україна';
    if (
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        CustomDataAttributes.address,
      )
    ) {
      // PA of first iteration, only has 1 address field
      ukrPoshtaFspInstructions['Postal index'] = null;
      ukrPoshtaFspInstructions['Oblast'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.oblast,
        );
      ukrPoshtaFspInstructions['Raion'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.raion,
        );
      ukrPoshtaFspInstructions['City'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.address,
        );
      ukrPoshtaFspInstructions['Street'] = null;
      ukrPoshtaFspInstructions['House number'] = null;
      ukrPoshtaFspInstructions['Apartment/Office'] = null;
    }
    if (
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        CustomDataAttributes.addressNoPostalIndex,
      )
    ) {
      // PA of second iteration, only has an address field (no postal index) & postal index field
      ukrPoshtaFspInstructions['Postal index'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.postalIndex,
        );
      ukrPoshtaFspInstructions['Oblast'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.oblast,
        );
      ukrPoshtaFspInstructions['Raion'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.raion,
        );
      ukrPoshtaFspInstructions['City'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.addressNoPostalIndex,
        );
      ukrPoshtaFspInstructions['Street'] = null;
      ukrPoshtaFspInstructions['House number'] = null;
      ukrPoshtaFspInstructions['Apartment/Office'] = null;
    }
    if (
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        CustomDataAttributes.city,
      )
    ) {
      // PA of third iteration, has all address information in seperate fields
      ukrPoshtaFspInstructions['Postal index'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.postalIndex,
        );
      ukrPoshtaFspInstructions['Oblast'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.oblast,
        );
      ukrPoshtaFspInstructions['Raion'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.raion,
        );
      ukrPoshtaFspInstructions['City'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.city,
        );
      ukrPoshtaFspInstructions['Street'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.street,
        );
      ukrPoshtaFspInstructions['House number'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.house,
        );
      ukrPoshtaFspInstructions['Apartment/Office'] =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          CustomDataAttributes.apartmentOrOffice,
        );
    }
    ukrPoshtaFspInstructions['Special notes'] = 'без повідомлення';
    ukrPoshtaFspInstructions['Email'] = null;
    ukrPoshtaFspInstructions['Telephone'] = this.formatPhoneNumber(
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        CustomDataAttributes.phoneNumber,
      ),
    );
    ukrPoshtaFspInstructions['Tax ID number'] =
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
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
