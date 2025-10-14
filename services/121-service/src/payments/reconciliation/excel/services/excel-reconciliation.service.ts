import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { GetImportTemplateResponseDto } from '@121-service/src/payments/dto/get-import-template-response.dto';
import { ReconciliationFeedbackDto } from '@121-service/src/payments/dto/reconciliation-feedback.dto';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { ExcelStatusColumn } from '@121-service/src/payments/reconciliation/excel/excel-status-column.const';
import { ExcelReconciliationFeedbackService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-feedback.service';
import { ExcelReconciliationValidationService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-validation.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
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
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionEventsScopedRepository: TransactionEventsScopedRepository,
    private readonly excelReconciliationValidationService: ExcelReconciliationValidationService,
    private readonly excelReconciliationFeedbackService: ExcelReconciliationFeedbackService,
    @Inject(REQUEST) private request: ScopedUserRequest,
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
        template: [matchColumn, ExcelStatusColumn],
      });
    }

    return templates;
  }

  public async upsertFspReconciliationData({
    file,
    programId,
    paymentId,
  }: {
    file: Express.Multer.File;
    programId: number;
    paymentId: number;
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

    const uniqueFspConfigIds =
      await this.excelReconciliationValidationService.getUniqueFspConfigIdsRelatedToImport(
        {
          matchColumn,
          csvContents,
          paymentId,
          programId,
        },
      );

    this.excelReconciliationValidationService.validateExactlyOneFspConfigRelatedToImport(
      uniqueFspConfigIds,
    );
    const fspConfigIdForImport = uniqueFspConfigIds[0]; // There is exactly one, so take the first

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
  }: {
    programId: number;
    paymentId: number;
    matchColumn: string;
    csvContents: CsvContents;
    transactionStatus: TransactionStatusEnum;
    programFspConfigurationId: number;
  }) {
    const programRegistrationAttributeId =
      await this.programRegistrationAttributeRepository.getIdByNameAndProgramId(
        {
          name: matchColumn,
          programId,
        },
      );

    const matchColumnValuesForCurrentStatus = csvContents
      .filter((r) => r[ExcelStatusColumn] === transactionStatus)
      .map((r) => r[matchColumn]); // So a list of phone numbers or nationalIds
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
    // Does not need to be scoped because we already used the scoped repository to get the transaction ids
    await this.transactionRepository.update(transactionIdsToUpdate, {
      status: transactionStatus,
    });

    // We create transaction events regardless of whether the transaction status was changed or not
    // Creating the same event multiple times is by design, to have a complete history of reconciliations
    await this.createAndSaveTransactionEvents({
      transactionIds: transactionIdsToUpdate,
      transactionStatus,
      programFspConfigurationId,
    });
  }

  private async createAndSaveTransactionEvents({
    transactionIds,
    transactionStatus,
    programFspConfigurationId,
  }: {
    transactionIds: number[];
    transactionStatus: TransactionStatusEnum;
    programFspConfigurationId: number;
  }): Promise<void> {
    const userId: number = this.request!.user!['id']!; // Should always be defined because this method is called from a context where a user is logged in
    const transactionEvents: TransactionEventEntity[] = transactionIds.map(
      (id) =>
        this.transactionEventsScopedRepository.create({
          type: TransactionEventType.processingStep,
          description: TransactionEventDescription.excelFileReconciled,
          isSuccessfullyCompleted:
            transactionStatus !== TransactionStatusEnum.error,
          errorMessage: null,
          transactionId: id,
          userId,
          programFspConfigurationId,
        }),
    );
    await this.transactionEventsScopedRepository.save(transactionEvents, {
      chunk: 1000,
    });
  }
}
