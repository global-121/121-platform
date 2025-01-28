import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { GetImportTemplateResponseDto } from '@121-service/src/payments/dto/get-import-template-response.dto';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { ReconciliationFeedbackDto } from '@121-service/src/payments/dto/reconciliation-feedback.dto';
import { ExcelFspInstructions } from '@121-service/src/payments/fsp-integration/excel/dto/excel-fsp-instructions.dto';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { ReconciliationReturnType } from '@121-service/src/payments/interfaces/reconciliation-return-type.interface';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Injectable()
export class ExcelRecociliationService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  private statusColumnName = 'status';

  public constructor(
    private readonly actionService: ActionsService,
    private readonly transactionsService: TransactionsService,
    private readonly excelService: ExcelService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly fileImportService: FileImportService,
  ) {}

  public async getImportInstructionsTemplate(
    programId: number,
  ): Promise<GetImportTemplateResponseDto[]> {
    const programWithExcelFspConfigs = await this.programRepository.findOne({
      where: {
        id: Equal(programId),
        programFinancialServiceProviderConfigurations: {
          financialServiceProviderName: Equal(FinancialServiceProviders.excel),
        },
      },
      relations: ['programFinancialServiceProviderConfigurations'],
      order: {
        programFinancialServiceProviderConfigurations: {
          name: 'ASC',
        },
      },
    });

    if (!programWithExcelFspConfigs) {
      throw new HttpException(
        'No program with `Excel` FSP found',
        HttpStatus.NOT_FOUND,
      );
    }

    const templates: GetImportTemplateResponseDto[] = [];
    for (const fspConfig of programWithExcelFspConfigs.programFinancialServiceProviderConfigurations) {
      const matchColumn = await this.excelService.getImportMatchColumn(
        fspConfig.id,
      );
      templates.push({
        name: fspConfig.name,
        template: [matchColumn, 'status'],
      });
    }

    return templates;
  }

  public async upsertFspReconciliationData(
    file: Express.Multer.File,
    programId: number,
    payment: number,
    userId: number,
  ): Promise<{
    importResult: ReconciliationFeedbackDto[];
    aggregateImportResult: {
      countPaymentFailed: number;
      countPaymentSuccess: number;
      countNotFound: number;
    };
  }> {
    const program = await this.programRepository.findOneOrFail({
      where: {
        id: Equal(programId),
      },
      relations: ['programFinancialServiceProviderConfigurations'],
    });
    const fspConfigsExcel: ProgramFinancialServiceProviderConfigurationEntity[] =
      [];
    for (const fspConfig of program.programFinancialServiceProviderConfigurations) {
      if (
        fspConfig.financialServiceProviderName ===
        FinancialServiceProviders.excel
      ) {
        fspConfigsExcel.push(fspConfig);
      }
    }
    if (!fspConfigsExcel.length) {
      throw new HttpException(
        'Other reconciliation FSPs than `Excel` are currently not supported.',
        HttpStatus.NOT_FOUND,
      );
    }

    const importResults = await this.processReconciliationData({
      file,
      payment,
      programId,
      fspConfigs: fspConfigsExcel,
    });

    for (const fspConfig of fspConfigsExcel) {
      const transactions = importResults
        .filter(
          (r) =>
            r.programFinancialServiceProviderConfigurationId === fspConfig.id,
        )
        .map((r) => r.transaction)
        .filter((t): t is PaTransactionResultDto => t !== undefined);

      await this.transactionsService.storeReconciliationTransactionsBulk(
        transactions,
        {
          programId,
          paymentNr: payment,
          userId,
          programFinancialServiceProviderConfigurationId: fspConfig.id,
        },
      );
    }

    const feedback: ReconciliationFeedbackDto[] = importResults.map(
      (r) => r.feedback,
    );
    const aggregateImportResult = this.countFeedbackResults(feedback);

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.importFspReconciliation,
    );

    return {
      importResult: feedback,
      aggregateImportResult,
    };
  }

  private countFeedbackResults(feedback: ReconciliationFeedbackDto[]): {
    countPaymentSuccess: number;
    countPaymentFailed: number;
    countNotFound: number;
  } {
    let countPaymentSuccess = 0;
    let countPaymentFailed = 0;
    let countNotFound = 0;

    for (const result of feedback) {
      if (!result.referenceId) {
        countNotFound += 1;
        continue;
      }
      if (result.importStatus === ImportStatus.paymentSuccess) {
        countPaymentSuccess += 1;
      } else if (result.importStatus === ImportStatus.paymentFailed) {
        countPaymentFailed += 1;
      } else if (result.importStatus === ImportStatus.notFound) {
        countNotFound += 1;
      }
    }

    return { countPaymentSuccess, countPaymentFailed, countNotFound };
  }

  public async processReconciliationData({
    file,
    payment,
    programId,
    fspConfigs,
  }: {
    file: Express.Multer.File;
    payment: number;
    programId: number;
    fspConfigs: ProgramFinancialServiceProviderConfigurationEntity[];
  }): Promise<ReconciliationReturnType[]> {
    const maxRecords = 10000;
    const validatedExcelImport = await this.fileImportService.validateCsv(
      file,
      maxRecords,
    );

    // First set up unfilled feedback object based on import rows ..
    const crossFspConfigImportResults: ReconciliationReturnType[] = [];
    for (const row of validatedExcelImport) {
      const resultRow = new ReconciliationReturnType();
      resultRow.feedback = new ReconciliationFeedbackDto();
      resultRow.feedback = {
        ...row,
        importStatus: ImportStatus.notFound,
        referenceId: null,
        message: null,
      };
      resultRow.programFinancialServiceProviderConfigurationId = undefined;
      resultRow.transaction = undefined;
      crossFspConfigImportResults.push(resultRow);
    }

    // .. then loop over fspConfigs to update rows where matched
    for await (const fspConfig of fspConfigs) {
      const matchColumn = await this.excelService.getImportMatchColumn(
        fspConfig.id,
      );
      const importResultForFspConfig = await this.reconciliatePayments({
        programId,
        payment,
        validatedExcelImport,
        fspConfig,
        matchColumn,
      });
      // Convert the array into a map for increased performace (hashmap lookup)
      const importResultForFspConfigMap = new Map(
        importResultForFspConfig.map((item) => [
          item.feedback[matchColumn],
          item,
        ]),
      );

      // .. then loop over each row of the original import to update if a match has been found with this fspConfig
      crossFspConfigImportResults.forEach((row, index) => {
        const importResultForFspConfigRow = importResultForFspConfigMap.get(
          row.feedback[matchColumn],
        );
        if (
          importResultForFspConfigRow?.feedback.importStatus !==
          ImportStatus.notFound
        ) {
          crossFspConfigImportResults[index] = importResultForFspConfigRow!;
        }
      });
    }
    return crossFspConfigImportResults;
  }

  private async reconciliatePayments({
    programId,
    payment,
    validatedExcelImport,
    fspConfig,
    matchColumn,
  }: {
    programId: number;
    payment: number;
    validatedExcelImport: object[];
    fspConfig: ProgramFinancialServiceProviderConfigurationEntity;
    matchColumn: string;
  }): Promise<ReconciliationReturnType[]> {
    const registrationsForReconciliation =
      await this.getRegistrationsForReconciliation(
        programId,
        payment,
        matchColumn,
        fspConfig.id,
      );
    if (!registrationsForReconciliation?.length) {
      return [];
    }
    const lastTransactions = await this.transactionsService.getLastTransactions(
      programId,
      payment,
      undefined,
      undefined,
      fspConfig.id,
    );
    // Join registration data with the imported CSV records
    return this.joinRegistrationsAndImportRecords(
      registrationsForReconciliation,
      validatedExcelImport,
      matchColumn,
      lastTransactions,
      fspConfig.id,
    );
  }

  private async getRegistrationsForReconciliation(
    programId: number,
    payment: number,
    matchColumn: string,
    programFinancialServiceProviderConfigurationId: number,
  ): Promise<MappedPaginatedRegistrationDto[]> {
    const qb =
      this.registrationsPaginationService.getQueryBuilderForFspInstructions({
        programId,
        payment,
        programFinancialServiceProviderConfigurationId,
        financialServiceProviderName: FinancialServiceProviders.excel,
      });
    // log query
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

  private joinRegistrationsAndImportRecords(
    registrations: Awaited<
      ReturnType<ExcelRecociliationService['getRegistrationsForReconciliation']>
    >,
    importRecords: object[],
    matchColumn: string,
    existingTransactions: TransactionReturnDto[],
    fspConfigId: number,
  ): ReconciliationReturnType[] {
    // First order registrations by referenceId to join amount from transactions
    const registrationsOrderedByReferenceId = registrations.sort((a, b) =>
      a.referenceId.localeCompare(b.referenceId),
    );
    const registrationsWithAmount =
      this.excelService.joinRegistrationsAndTransactions(
        registrationsOrderedByReferenceId,
        existingTransactions,
        ['id', 'referenceId', matchColumn],
      );

    // Then order registrations and importRecords by matchColumn to join them
    const importRecordsOrdered = importRecords.sort((a, b) =>
      a[matchColumn]?.localeCompare(b[matchColumn]),
    );
    const registrationsOrdered = registrationsWithAmount.sort((a, b) =>
      (a[matchColumn] as string).localeCompare(b[matchColumn] as string),
    );

    const resultFeedback: ReconciliationReturnType[] = [];
    for (const record of importRecordsOrdered) {
      let transaction: PaTransactionResultDto | null = null;
      let importStatus = ImportStatus.notFound;

      if (
        ![TransactionStatusEnum.success, TransactionStatusEnum.error].includes(
          record[this.statusColumnName]?.toLowerCase(),
        )
      ) {
        const errors = `The 'status' column is either missing or contains unexpected values. It should only contain 'success' or 'error'.`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      } else if (record[matchColumn] === undefined) {
        const errors = `The match column '${matchColumn}' is missing.`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }

      // find registration with matching matchColumn value
      const matchedRegistration = registrationsOrdered.find(
        (r) => r[matchColumn] === record[matchColumn],
      );
      if (matchedRegistration) {
        transaction = this.createTransactionResult(matchedRegistration, record);
        importStatus =
          transaction.status === TransactionStatusEnum.success
            ? ImportStatus.paymentSuccess
            : ImportStatus.paymentFailed;
      }
      resultFeedback.push({
        feedback: {
          referenceId: (matchedRegistration?.referenceId as string) ?? null,
          status: transaction?.status ?? null,
          message: transaction?.message ?? null,
          importStatus,
          [matchColumn]: record[matchColumn],
        },
        programFinancialServiceProviderConfigurationId: matchedRegistration
          ? fspConfigId
          : undefined,
        transaction: transaction || undefined,
      });
    }

    return resultFeedback;
  }

  private createTransactionResult(
    registrationWithAmount: ExcelFspInstructions,
    importResponseRecord: any,
  ): PaTransactionResultDto {
    return {
      referenceId: registrationWithAmount.referenceId,
      registrationId: registrationWithAmount.id,
      fspName: FinancialServiceProviders.excel,
      status: importResponseRecord[
        this.statusColumnName
      ]?.toLowerCase() as TransactionStatusEnum,
      calculatedAmount: registrationWithAmount.amount,
      message: null,
    };
  }
}
