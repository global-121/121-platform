import { Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { CustomDataAttributes } from '../../../registration/enum/custom-data-attributes';
import { RegistrationDataService } from '../../../registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '../../dto/transaction-relation-details.dto';
import { TransactionReturnDto } from '../../transactions/dto/get-transaction.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { BobFinanceFspInstructions } from './dto/bob-finance-fsp-instructions.dto';

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
    fspTransactionResult.fspName = FspName.bobFinance;
    for (const payment of paymentList) {
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = payment.transactionAmount;
      transactionResult.fspName = FspName.bobFinance;
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
