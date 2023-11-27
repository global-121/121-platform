import { Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { CustomDataAttributes } from '../../../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionReturnDto } from '../../transactions/dto/get-transaction.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { GenericFspInstructions } from './dto/generic-fsp-instructions.dto';

@Injectable()
export class GenericFspService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly lookupService: LookupService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.genericFsp;
    for (const payment of paymentList) {
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = payment.transactionAmount;
      transactionResult.fspName = FspName.genericFsp;
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
    transaction: TransactionReturnDto,
  ): Promise<GenericFspInstructions> {
    const genericFspInstructions = new GenericFspInstructions();

    genericFspInstructions['Receiver First name'] =
      await registration.getRegistrationDataValueByName(
        CustomDataAttributes.nameFirst,
      );
      genericFspInstructions['Receiver last name'] =
      await registration.getRegistrationDataValueByName(
        CustomDataAttributes.nameLast,
      );
      genericFspInstructions['Mobile Number'] = await this.formatToLocalNumber(
      await registration.getRegistrationDataValueByName(
        CustomDataAttributes.nameLast,
      ),
    );
    genericFspInstructions.Email = null;
    genericFspInstructions.Amount = transaction.amount;
    genericFspInstructions.Currency = 'USD';
    genericFspInstructions['Expiry Date'] = null;

    return genericFspInstructions;
  }

  private async formatToLocalNumber(phonenumber: string): Promise<number> {
    return await this.lookupService.getLocalNumber(`+${phonenumber}`);
  }
}
