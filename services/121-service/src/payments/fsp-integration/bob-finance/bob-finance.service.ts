import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import { BobFinanceFspInstructions } from '@121-service/src/payments/fsp-integration/bob-finance/dto/bob-finance-fsp-instructions.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BobFinanceService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly lookupService: LookupService,
    private registrationDataService: RegistrationDataService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FinancialServiceProviderName.bobFinance;
    for (const payment of paymentList) {
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = payment.transactionAmount;
      transactionResult.fspName = FinancialServiceProviderName.bobFinance;
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
  ): Promise<BobFinanceFspInstructions> {
    const bobFinanceFspInstructions = new BobFinanceFspInstructions();

    bobFinanceFspInstructions['Receiver First name'] =
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        CustomDataAttributes.nameFirst,
      );
    bobFinanceFspInstructions['Receiver last name'] =
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        CustomDataAttributes.nameLast,
      );
    bobFinanceFspInstructions['Mobile Number'] = await this.formatToLocalNumber(
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        CustomDataAttributes.nameLast,
      ),
    );
    bobFinanceFspInstructions.Email = null;
    bobFinanceFspInstructions.Amount = transaction.amount;
    bobFinanceFspInstructions.Currency = 'USD';
    bobFinanceFspInstructions['Expiry Date'] = null;

    return bobFinanceFspInstructions;
  }

  private async formatToLocalNumber(phonenumber: string): Promise<number> {
    return await this.lookupService.getLocalNumber(`+${phonenumber}`);
  }
}
