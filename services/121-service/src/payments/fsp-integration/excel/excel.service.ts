import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import {
  ExcelFspInstructions,
  ExcelReconciliationDto,
} from '@121-service/src/payments/fsp-integration/excel/dto/excel-fsp-instructions.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { BulkImportResult } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ExcelService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  private statusColumnName = 'status';

  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FinancialServiceProviderName.excel;
    for (const paPayment of paPaymentList) {
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = paPayment.transactionAmount;
      transactionResult.fspName = FinancialServiceProviderName.excel;
      transactionResult.referenceId = paPayment.referenceId;
      transactionResult.status = StatusEnum.waiting;
      fspTransactionResult.paList.push(transactionResult);
    }
    const transactionRelationDetails = {
      programId,
      paymentNr,
      userId: paPaymentList[0].userId,
    };
    await this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      transactionRelationDetails,
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
    const qb = this.registrationsPaginationService.getQueryBuilderForFsp(
      programId,
      payment,
      FinancialServiceProviderName.excel,
      StatusEnum.waiting,
    );
    const chunkSize = 400000;
    const registrations =
      await this.registrationsPaginationService.getRegistrationsChunked(
        programId,
        {
          select: [...new Set(exportColumns.concat(['referenceId']))], // add referenceId (and deduplicate) to join transaction amount later
          path: '',
        },
        chunkSize,
        qb,
      );

    return this.joinRegistrationsAndTransactions(
      registrations,
      transactions,
      exportColumns,
    );
  }

  private async getExportColumnsForProgram(
    programId: number,
  ): Promise<string[]> {
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
        {
          configName: FinancialServiceProviderConfigurationEnum.columnsToExport,
        },
      )
      .andWhere('program.id = :programId', {
        programId: programId,
      })
      .getOneOrFail();

    let exportColumns: string[];
    const columnsToExportConfig =
      programWithConfig.programFspConfiguration[0]?.value;
    if (columnsToExportConfig) {
      exportColumns = columnsToExportConfig as string[];
    } else {
      // Default to using all program questions & attributes names if columnsToExport is not specified
      // So generic fields must be specified in the programFspConfiguration
      exportColumns = programWithConfig.programQuestions
        .map((q) => q.name)
        .concat(programWithConfig.programCustomAttributes.map((q) => q.name));
    }
    return exportColumns;
  }

  private joinRegistrationsAndTransactions(
    orderedRegistrations: Awaited<
      ReturnType<RegistrationsPaginationService['getRegistrationsChunked']>
    >,
    transactions: TransactionReturnDto[],
    exportColumns: string[],
  ): ExcelFspInstructions[] {
    // # of transactions and registrations should be the same or throw
    if (transactions.length !== orderedRegistrations.length) {
      throw new Error(
        `Number of transactions (${transactions.length}) and registrations (${orderedRegistrations.length}) do not match`,
      );
    }
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

  public async getImportMatchColumn(programId: number): Promise<string> {
    const programWithConfig = await this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect(
        'program.programFspConfiguration',
        'programFspConfiguration',
        'programFspConfiguration.name = :configName',
        { configName: FinancialServiceProviderConfigurationEnum.columnToMatch },
      )
      .andWhere('program.id = :programId', {
        programId: programId,
      })
      .getOne();
    const matchColumn: string = programWithConfig?.programFspConfiguration[0]
      ?.value as string;
    if (!matchColumn) {
      throw new HttpException(
        {
          errors: `No match column found for FSP 'Excel' and program with id ${programId}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return matchColumn;
  }

  public async getRegistrationsForReconciliation(
    programId: number,
    payment: number,
    matchColumn: string,
  ) {
    const qb = this.registrationsPaginationService.getQueryBuilderForFsp(
      programId,
      payment,
      FinancialServiceProviderName.excel,
    );
    const chunkSize = 400000;
    return await this.registrationsPaginationService.getRegistrationsChunked(
      programId,
      {
        select: [matchColumn, 'referenceId', 'id'],
        path: '',
      },
      chunkSize,
      qb,
    );
  }

  public joinRegistrationsAndImportRecords(
    registrations: Awaited<
      ReturnType<ExcelService['getRegistrationsForReconciliation']>
    >,
    importRecords: object[],
    matchColumn: string,
    transactions: TransactionReturnDto[],
  ): BulkImportResult[] {
    // First order registrations by referenceId to join amount from transactions
    const registrationsOrderedByReferenceId = registrations.sort((a, b) =>
      a.referenceId.localeCompare(b.referenceId),
    );
    const registrationsWithAmount = this.joinRegistrationsAndTransactions(
      registrationsOrderedByReferenceId,
      transactions,
      ['id', 'referenceId', matchColumn],
    );

    // Then order registrations and importRecords by matchColumn to join them
    const importRecordsOrdered = importRecords.sort((a, b) =>
      a[matchColumn]?.localeCompare(b[matchColumn]),
    );
    const registrationsOrdered = registrationsWithAmount.sort((a, b) =>
      a[matchColumn]?.localeCompare(b[matchColumn]),
    );

    const importResponseRecords = importRecordsOrdered.map((record) => {
      if (
        ![StatusEnum.success, StatusEnum.error].includes(
          record[this.statusColumnName]?.toLowerCase(),
        )
      ) {
        const errors = `The 'status' column is either missing or contains unexpected values. It should only contain 'success' or 'error'.`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      } else if (record[matchColumn] === undefined) {
        const errors = `The match column '${matchColumn}' is missing.`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }

      const importResponseRecord = record as BulkImportResult;
      // find registration with matching matchColumn value
      const matchedRegistration = registrationsOrdered.find(
        (r) => r[matchColumn] === record[matchColumn],
      );
      if (matchedRegistration) {
        importResponseRecord['paTransactionResult'] =
          this.createTransactionResult(
            matchedRegistration as ExcelReconciliationDto,
            record,
          );
      }
      return importResponseRecord;
    });

    return importResponseRecords;
  }

  public createTransactionResult(
    registrationWithAmount: ExcelReconciliationDto,
    importResponseRecord: any,
  ): PaTransactionResultDto {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.referenceId = registrationWithAmount.referenceId;
    paTransactionResult.registrationId = registrationWithAmount.id;
    paTransactionResult.fspName = FinancialServiceProviderName.excel;
    paTransactionResult.status = importResponseRecord[
      this.statusColumnName
    ]?.toLowerCase() as StatusEnum;
    paTransactionResult.calculatedAmount = registrationWithAmount.amount;
    return paTransactionResult;
  }
}
