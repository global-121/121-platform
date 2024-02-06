import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspConfigurationEnum, FspName } from '../../../fsp/enum/fsp-name.enum';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationViewScopedRepository } from '../../../registration/registration-scoped.repository';
import { RegistrationViewEntity } from '../../../registration/registration-view.entity';
import { RegistrationsPaginationService } from '../../../registration/services/registrations-pagination.service';
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
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
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
    transactions: TransactionReturnDto[],
    programId: number,
    payment: number,
  ): Promise<ExcelFspInstructions[]> {
    const exportColumns = await this.getExportColumnsForProgram(programId);
    // Creating a new query builder since it is imposssible to do a where in query if there are more than 500000 referenceIds
    const qb = this.getQueryBuilderForExportColumns(programId, payment);

    const registrations =
      await this.registrationsPaginationService.getRegistrationsChunked(
        programId,
        {
          select: exportColumns, //add referenceId to join transaction amount later
          path: '',
        },
        400000,
        qb,
      );

    // # of transactions and registrations should be the same or throw
    // in theory this should never happen
    if (transactions.length !== registrations.length) {
      throw new Error(
        `Number of transactions (${transactions.length}) and registrations (${registrations.length}) do not match`,
      );
    }

    return this.joinRegistrationsAndTransactions(
      registrations,
      transactions,
      exportColumns,
    );
  }

  private async getExportColumnsForProgram(programId: number) {
    const programWithConfig = await this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.programQuestions', 'programQuestions')
      .leftJoinAndSelect(
        'program.programCustomAttributes',
        'programCustomAttributes',
      )
      .leftJoinAndSelect(
        'program.programFspConfiguration',
        'programFspConfiguration',
        'programFspConfiguration.name = :configName',
        { configName: FspConfigurationEnum.columnsToExport },
      )
      .andWhere('program.id = :programId', {
        programId: programId,
      })
      .getOne();

    let exportColumns: string[];
    const columnsToExportConfig =
      programWithConfig.programFspConfiguration[0]?.value;
    if (columnsToExportConfig) {
      exportColumns = JSON.parse(columnsToExportConfig);
    } else {
      // Default to using all program questions & attributes names if columnsToExport is not specified
      // So generic fields must be specified in the programFspConfiguration
      exportColumns = programWithConfig.programQuestions
        .map((q) => q.name)
        .concat(programWithConfig.programCustomAttributes.map((q) => q.name));
    }
    exportColumns = exportColumns.concat(['referenceId']); // add referenceId to join transaction amount later
    exportColumns = [...new Set(exportColumns)]; // remove duplicates
    return exportColumns;
  }

  private joinRegistrationsAndTransactions(
    orderedRegistrations: RegistrationViewEntity[],
    transactions: TransactionReturnDto[],
    exportColumns: string[],
  ): ExcelFspInstructions[] {
    // This method joins the registrations and transactions arrays based on the referenceId.
    // Both arrays are assumed to be sorted by referenceId. This allows us to use a two-pointer
    // technique to join the arrays, which is more efficient than using a nested loop or the find method.
    const transactionsOrdered = transactions.sort((a, b) =>
      a.referenceId.localeCompare(b.referenceId),
    );
    let j = 0;
    const excelFspInstructions = orderedRegistrations.map((registration) => {
      const fspInstructions = new ExcelFspInstructions();
      for (const col of exportColumns) {
        fspInstructions[col] = registration[col];
      }

      // As both arrays are sorted by referenceId, corresponding transactions for a registration
      // will always be at the current position or ahead in the transactions array.
      // This way performance is O(n) instead of O(n^2)
      while (
        transactionsOrdered[j] &&
        transactionsOrdered[j].referenceId < registration.referenceId
      ) {
        j++;
      }

      if (
        transactionsOrdered[j] &&
        transactionsOrdered[j].referenceId === registration.referenceId
      ) {
        fspInstructions.amount = transactionsOrdered[j].amount;
      }

      return fspInstructions;
    });
    return excelFspInstructions;
  }

  private getQueryBuilderForExportColumns(programId: number, payment: number) {
    return this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .innerJoin('registration.latestTransactions', 'latestTransaction')
      .innerJoin('latestTransaction.transaction', 'transaction')
      .innerJoin('transaction.financialServiceProvider', 'fsp')
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('transaction.payment = :payment', { payment })
      .andWhere('fsp.fsp = :fsp', {
        fsp: FspName.excel,
      })
      .orderBy('registration.referenceId', 'ASC');
  }
}
