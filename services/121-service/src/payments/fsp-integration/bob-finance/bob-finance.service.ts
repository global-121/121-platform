import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { ImportStatus } from '../../../registration/dto/bulk-import.dto';
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
import { BobFinanceFspInstructions } from './dto/bob-finance-fsp-instructions.dto';
import {
  BobFinanceReconciliationData,
  BobFinanceStatus,
} from './dto/bob-finance-reconciliation-data.dto';

@Injectable()
export class BobFinanceService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

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
    fspTransactionResult.fspName = FspName.bobFinance;
    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = calculatedAmount;
      transactionResult.fspName = FspName.bobFinance;
      transactionResult.referenceId = payment.referenceId;
      transactionResult.status = StatusEnum.waiting;
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
  ): Promise<BobFinanceFspInstructions> {
    const bobFinanceFspInstructions = new BobFinanceFspInstructions();

    bobFinanceFspInstructions['Receiver First name'] =
      registration.customData[CustomDataAttributes.nameFirst];
    bobFinanceFspInstructions['Receiver last name'] =
      registration.customData[CustomDataAttributes.nameLast];
    bobFinanceFspInstructions['Mobile Number'] = await this.formatToLocalNumber(
      registration.customData[CustomDataAttributes.phoneNumber],
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

  public validateReconciliationData(row): BobFinanceReconciliationData {
    let importRecord = new BobFinanceReconciliationData();
    importRecord['Customer First Name'] = row['Customer First Name'];
    importRecord['Customer Last Name'] = row['Customer Last Name'];
    importRecord['Customer Mobile Number'] = row['Customer Mobile Number'];
    importRecord['Transaction Number'] = row['Transaction Number'];
    importRecord['Status'] = row['Status'];
    importRecord['Status Creation Date'] = row['Status Creation Date'];
    importRecord['Status Creation Time'] = row['Status Creation Time'];
    importRecord['Amount'] = row['Amount'];
    importRecord['Currency'] = row['Currency'];
    return importRecord;
  }

  public async findRegistrationFromInput(record): Promise<RegistrationEntity> {
    const registrations = await this.registrationRepository.find({
      relations: ['fsp'],
    });
    return registrations.find(
      async registration =>
        registration.customData[CustomDataAttributes.nameFirst] ===
          record['Customer First Name'] &&
        registration.customData[CustomDataAttributes.nameLast] ===
          record['Customer Last Name'] &&
        (await this.formatToLocalNumber(
          registration.customData[CustomDataAttributes.phoneNumber],
        )) === record['Customer Mobile Number'],
    );
  }

  public async uploadReconciliationData(
    registration: RegistrationEntity,
    record,
    programId: number,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.referenceId = registration.referenceId;
    paTransactionResult.status =
      record['Status'] == BobFinanceStatus.Paid
        ? StatusEnum.success
        : record['Status'] == BobFinanceStatus.Canceled
        ? StatusEnum.error
        : StatusEnum.waiting;
    paTransactionResult.fspName = FspName.bobFinance;
    paTransactionResult.message = record['Status'];
    paTransactionResult.calculatedAmount = Number(record['Amount']);
    paTransactionResult.payment = await this.findPaymentFromDate(
      record,
      programId,
    );
    return paTransactionResult;
  }

  private async findPaymentFromDate(
    record,
    programId: number,
  ): Promise<number> {
    const transactions = await this.transactionsService.getTransactions(
      programId,
      false,
    );
    const dateParts = record['Status Creation Date'].split('/');
    const inputDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    // NOTE: this code works now but is insufficient
    // 121-portal payment date is not necessarily the same as bob-portal upload date
    // Also, there could theoretically be multiple payments on same day. You could start using time then, but quickly gets messy.
    // All of this is result of not being able to pass some 'reference-id' in bob-portal upload
    const filteredTransactions = transactions.filter(transaction => {
      return (
        transaction.paymentDate.setHours(0, 0, 0, 0) ===
        inputDate.setHours(0, 0, 0, 0)
      );
    });
    const payment = filteredTransactions[0].payment;
    return payment;
  }
}
