import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { GetImportTemplateResponseDto } from '@121-service/src/payments/dto/get-import-template-response.dto';
import { ReconciliationFeedbackDto } from '@121-service/src/payments/dto/reconciliation-feedback.dto';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { ExcelReconciliationDefaultColumns } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation-default-columns.enum';
import { ExcelReconciliationFeedbackService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-feedback.service';
import { ExcelReconciliationValidationService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-validation.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import {
  CsvContents,
  FileImportService,
} from '@121-service/src/utils/file-import/file-import.service';

@Injectable()
export class ExcelReconciliationService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly excelService: ExcelService,
    private readonly fileImportService: FileImportService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,

    private readonly transactionsService: TransactionsService,
    private readonly transactionEventsScopedRepository: TransactionEventsScopedRepository,
    private readonly excelReconciliationValidationService: ExcelReconciliationValidationService,
    private readonly excelReconciliationFeedbackService: ExcelReconciliationFeedbackService,
  ) {}

  public async getImportInstructionsTemplate(
    programId: number,
  ): Promise<GetImportTemplateResponseDto[]> {
    const programWithExcelFspConfigs = await this.programRepository.findOne({
      where: {
        id: Equal(programId),
        programFspConfigurations: {
          fspName: Equal(Fsps.excel),
        },
      },
      relations: {
        programFspConfigurations: true,
      },
      order: {
        programFspConfigurations: {
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
    for (const fspConfig of programWithExcelFspConfigs.programFspConfigurations) {
      const matchColumn = await this.excelService.getImportMatchColumn(
        fspConfig.id,
      );
      templates.push({
        name: fspConfig.name,
        template: [
          matchColumn,
          ExcelReconciliationDefaultColumns.status,
          ExcelReconciliationDefaultColumns.errorMessage,
        ],
      });
    }

    return templates;
  }

  public async upsertFspReconciliationData({
    file,
    programId,
    paymentId,
    userId,
  }: {
    file: Express.Multer.File;
    programId: number;
    paymentId: number;
    userId: number;
  }): Promise<{
    importResult: ReconciliationFeedbackDto[];
    aggregateImportResult: {
      countPaymentFailed: number;
      countPaymentSuccess: number;
      countNotFound: number;
    };
  }> {
    ////////////////////////////////////////////////////////////////////////////
    // Preparing
    ////////////////////////////////////////////////////////////////////////////
    if (
      await this.paymentsProgressHelperService.isPaymentInProgress(programId)
    ) {
      throw new HttpException(
        'Cannot import FSP reconciliation data while payment is in progress',
        HttpStatus.BAD_REQUEST,
      );
    }

    const program = await this.programRepository.findOneOrFail({
      where: {
        id: Equal(programId),
      },
      relations: {
        programFspConfigurations: true,
      },
    });

    const fspConfigsExcel =
      this.excelReconciliationValidationService.validateProgramHasExcelFspConfigs(
        program.programFspConfigurations,
      );

    const maxRecords = 10_000;
    const csvContents: CsvContents = await this.fileImportService.validateCsv(
      file,
      maxRecords,
    );

    this.excelReconciliationValidationService.validateStatusColumn(csvContents);

    this.excelReconciliationValidationService.validateErrorMessageColumn(
      csvContents,
    );

    const matchColumn =
      await this.excelReconciliationValidationService.validateOnlyOneMatchColumnIsUsedAndReturnIt(
        {
          fspConfigs: fspConfigsExcel,
          importColumnNames: Object.keys(csvContents[0]),
        },
      );

    this.excelReconciliationValidationService.validateNoDuplicateValuesInMatchColumn(
      {
        importRecords: csvContents,
        matchColumn,
      },
    );

    const fspConfigIdForImport =
      await this.excelReconciliationValidationService.validateExactlyOneFspConfigAndReturnIt(
        {
          matchColumn,
          csvContents,
          paymentId,
          programId,
        },
      );

    ////////////////////////////////////////////////////////////////////////////
    // Actually processing
    ////////////////////////////////////////////////////////////////////////////

    const statusesToUpdate = [
      TransactionStatusEnum.success,
      TransactionStatusEnum.error,
    ];
    for (const status of statusesToUpdate) {
      await this.reconcilePerTransactionStatus({
        programId,
        paymentId,
        matchColumn,
        csvContents,
        transactionStatus: status,
        programFspConfigurationId: fspConfigIdForImport,
        userId,
      });
    }

    ////////////////////////////////////////////////////////////////////////////
    // Create the resulting feedback
    ////////////////////////////////////////////////////////////////////////////

    return await this.excelReconciliationFeedbackService.createFeedbackDto({
      programId,
      paymentId,
      matchColumn,
      csvContents,
    });
  }

  private async reconcilePerTransactionStatus({
    programId,
    paymentId,
    matchColumn,
    csvContents,
    transactionStatus,
    programFspConfigurationId,
    userId,
  }: {
    programId: number;
    paymentId: number;
    matchColumn: string;
    csvContents: CsvContents;
    transactionStatus: TransactionStatusEnum;
    programFspConfigurationId: number;
    userId: number;
  }) {
    const programRegistrationAttributeId =
      await this.programRegistrationAttributeRepository.getIdByNameAndProgramId(
        {
          name: matchColumn,
          programId,
        },
      );

    const recordsForCurrentStatus = csvContents.filter(
      (record) =>
        record[ExcelReconciliationDefaultColumns.status] === transactionStatus,
    );
    const matchColumnValuesForCurrentStatus = recordsForCurrentStatus.map(
      (record) => record[matchColumn],
    ); // So a list of phone numbers or nationalIds
    const transactionIdsToUpdate: number[] =
      await this.registrationViewScopedRepository.getTransactionIdsByPaymentAndRegistrationData(
        {
          paymentId,
          programRegistrationAttributeId,
          dataValues: matchColumnValuesForCurrentStatus,
        },
      );

    if (transactionIdsToUpdate.length === 0) {
      return; // Nothing to do no transactions to update and no events to create
    }

    const errorMessages: Map<number, string> =
      transactionStatus === TransactionStatusEnum.error
        ? new Map(
            transactionIdsToUpdate.map((transactionId, index) => [
              transactionId,
              recordsForCurrentStatus[index].errorMessage as string,
            ]),
          )
        : new Map();

    await this.transactionsService.saveTransactionProgressBulk({
      newTransactionStatus: transactionStatus,
      transactionIds: transactionIdsToUpdate,
      description: TransactionEventDescription.excelReconciliationFileUpload,
      userId,
      programFspConfigurationId,
      errorMessages,
    });
  }
}
