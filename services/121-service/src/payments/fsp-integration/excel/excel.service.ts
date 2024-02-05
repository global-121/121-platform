import { Injectable } from '@nestjs/common';
import { AppDataSource } from '../../../../appdatasource';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
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
import { ExcelFspInstructions } from './dto/excel-fsp-instructions.dto';

@Injectable()
export class ExcelService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  public async getQueueProgress(_programId: number): Promise<number> {
    // TODO: When this is implemented, remove the '_' from the variable. This is a temporary solution to avoid the linter error.
    throw new Error('Method not implemented.');
  }

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.excel;
    for (const paPayment of paPaymentList) {
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = paPayment.transactionAmount;
      transactionResult.fspName = FspName.excel;
      transactionResult.referenceId = paPayment.referenceId;
      transactionResult.status = StatusEnum.success; // TODO: change this to 'waiting' once reconciliation is implemented
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
  ): Promise<ExcelFspInstructions> {
    // Fetch only necessary data with a single query
    const registrationRepo = AppDataSource.getRepository(RegistrationEntity);
    const registrationData = await registrationRepo
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.program', 'program')
      .leftJoin('program.programQuestions', 'programQuestions')
      .leftJoinAndSelect(
        'program.programFspConfiguration',
        'programFspConfiguration',
        'programFspConfiguration.name = :configName',
        { configName: 'columnsToBeExported' },
      )
      .select([
        'registration.phoneNumber',
        'program.ngo',
        'programFspConfiguration.value',
        'programQuestions',
      ])
      .where('registration.id = :registrationId', {
        registrationId: registration.id,
      })
      .getOne();

    console.log(registrationData.program.programFspConfiguration);
    if (!registrationData) {
      throw new Error('Registration data not found.');
    }

    // Check if columnsToBeExported is defined
    const fspConfigValue =
      registrationData.program.programFspConfiguration[0]?.value;

    let programColumns;
    if (fspConfigValue) {
      programColumns = JSON.parse(fspConfigValue);
    } else {
      // Default to using all program question names if columnsToBeExported is not specified
      programColumns = registrationData.program.programQuestions.map(
        (q) => q.name,
      );
    }

    const excelFspInstructions = new ExcelFspInstructions();
    // Assuming ExcelFspInstructions can accept dynamic keys
    for (const col of programColumns) {
      // Fetch and assign question values to excelFspInstructions
      // Implement logic to assign values based on registrationData and col
      excelFspInstructions[col] =
        await registration.getRegistrationDataValueByName(col);
    }

    // Populate other known fields
    excelFspInstructions.phoneNumber = registrationData.phoneNumber;
    excelFspInstructions.amount = transaction.amount;
    excelFspInstructions.reference = registrationData.program.ngo;

    return excelFspInstructions;
  }
}
