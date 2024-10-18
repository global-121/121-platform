import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { DataSource, Equal, Repository } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import {
  CsvInstructions,
  ExportFileType,
  FspInstructions,
} from '@121-service/src/payments/dto/fsp-instructions.dto';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { SplitPaymentListDto } from '@121-service/src/payments/dto/split-payment-lists.dto';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  BulkActionResultPaymentDto,
  BulkActionResultRetryPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import {
  ImportResult,
  ImportStatus,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { ReferenceIdsDto } from '@121-service/src/registration/dto/reference-id.dto';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { splitArrayIntoChunks } from '@121-service/src/utils/chunk.helper';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Injectable()
export class PaymentsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  private fspWithQueueServiceMapping: Partial<
    Record<
      FinancialServiceProviderName,
      | IntersolveVoucherService
      | IntersolveVisaService
      | SafaricomService
      | CommercialBankEthiopiaService
    >
  >;

  private financialServiceProviderNameToServiceMap: Record<
    FinancialServiceProviderName,
    [FinancialServiceProviderIntegrationInterface, useWhatsapp?: boolean]
  >;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly actionService: ActionsService,
    private readonly azureLogService: AzureLogService,
    private readonly transactionsService: TransactionsService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly safaricomService: SafaricomService,
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly excelService: ExcelService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly fileImportService: FileImportService,
    private readonly dataSource: DataSource,
  ) {
    this.fspWithQueueServiceMapping = {
      [FinancialServiceProviderName.intersolveVisa]: this.intersolveVisaService,
      [FinancialServiceProviderName.intersolveVoucherPaper]:
        this.intersolveVoucherService,
      [FinancialServiceProviderName.intersolveVoucherWhatsapp]:
        this.intersolveVoucherService,
      [FinancialServiceProviderName.safaricom]: this.safaricomService,
      [FinancialServiceProviderName.commercialBankEthiopia]:
        this.commercialBankEthiopiaService,
      // Add more FSP mappings if they work queue-based
    };

    this.financialServiceProviderNameToServiceMap = {
      [FinancialServiceProviderName.intersolveVoucherWhatsapp]: [
        this.intersolveVoucherService,
        true,
      ],
      [FinancialServiceProviderName.intersolveVoucherPaper]: [
        this.intersolveVoucherService,
        false,
      ],
      [FinancialServiceProviderName.intersolveVisa]: [
        this.intersolveVisaService,
      ],
      [FinancialServiceProviderName.safaricom]: [this.safaricomService],
      [FinancialServiceProviderName.commercialBankEthiopia]: [
        this.commercialBankEthiopiaService,
      ],
      [FinancialServiceProviderName.excel]: [this.excelService],
    };
  }

  public async getPayments(programId: number): Promise<
    {
      payment: number;
      paymentDate: Date | string;
      amount: number;
    }[]
  > {
    // Use unscoped repository, as you might not be able to select the correct payment in the portal otherwise
    const payments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('payment')
      .addSelect('MIN(transaction.created)', 'paymentDate')
      .andWhere('transaction.program.id = :programId', {
        programId,
      })
      .groupBy('payment')
      .getRawMany();
    return payments;
  }

  private async aggregateTransactionsByStatus(
    programId: number,
    payment: number,
  ): Promise<any[]> {
    return await this.dataSource
      .createQueryBuilder()
      .select(['status', 'COUNT(*) as count', 'SUM(amount) as totalAmount'])
      .from(
        '(' +
          this.transactionsService
            .getLastTransactionsQuery(programId, payment)
            .getQuery() +
          ')',
        'transactions',
      )
      .setParameters(
        this.transactionsService
          .getLastTransactionsQuery(programId, payment)
          .getParameters(),
      )
      .groupBy('status')
      .getRawMany();
  }

  public async getPaymentAggregation(
    programId: number,
    payment: number,
  ): Promise<PaymentReturnDto> {
    // Scoped, as this.transactionScopedRepository is used in the transaction.service.ts
    const statusAggregation = await this.aggregateTransactionsByStatus(
      programId,
      payment,
    );
    const totalAmountPerStatus = statusAggregation.reduce(
      (acc, row) => {
        acc[row.status] = {
          count: (acc[row.status]?.count || 0) + Number(row.count || 0),
          amount: (acc[row.status]?.amount || 0) + (row.totalamount || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    return {
      success: totalAmountPerStatus[TransactionStatusEnum.success] || {
        count: 0,
        amount: 0,
      },
      waiting: totalAmountPerStatus[TransactionStatusEnum.waiting] || {
        count: 0,
        amount: 0,
      },
      failed: totalAmountPerStatus[TransactionStatusEnum.error] || {
        count: 0,
        amount: 0,
      },
    };
  }

  public async postPayment(
    userId: number,
    programId: number,
    payment: number,
    amount: number | undefined,
    query: PaginateQuery,
    dryRun: boolean,
  ): Promise<BulkActionResultPaymentDto> {
    if (!dryRun) {
      await this.checkPaymentInProgressAndThrow(programId);
    }

    const paginateQuery =
      this.registrationsBulkService.setQueryPropertiesBulkAction(query, true);

    const bulkActionResultDto =
      await this.registrationsBulkService.getBulkActionResult(
        paginateQuery,
        programId,
        this.getPaymentBaseQuery(payment), // We need to create a seperate querybuilder object twice or it will be modified twice
      );

    if (!amount) {
      return {
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        fspsInPayment: [],
      };
    }

    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(
        programId,
        payment,
        paginateQuery,
      );

    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    const fspsInPayment: FinancialServiceProviderName[] = [];
    // This loop is pretty fast: with 131k registrations it takes ~38ms
    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
      if (
        !dryRun && // This is only needed in actual doPayment call
        registration.financialServiceProvider &&
        !fspsInPayment.includes(registration.financialServiceProvider)
      ) {
        fspsInPayment.push(registration.financialServiceProvider);
      }
    }
    const bulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      fspsInPayment,
    };

    const referenceIds = registrationsForPayment.map(
      (registration) => registration.referenceId,
    );

    if (!dryRun && referenceIds.length > 0) {
      void this.initiatePayment(
        userId,
        programId,
        payment,
        amount,
        referenceIds,
        registrationsForPayment.length,
      )
        .catch((e) => {
          this.azureLogService.logError(e, true);
        })
        .finally(() => {
          void this.actionService.saveAction(
            userId,
            programId,
            AdditionalActionType.paymentFinished,
          );
        });
    }

    return bulkActionResultPaymentDto;
  }

  private async getRegistrationsForPaymentChunked(
    programId: number,
    payment: number,
    paginateQuery: PaginateQuery,
  ) {
    const chunkSize = 4000;

    return await this.registrationsPaginationService.getRegistrationsChunked(
      programId,
      paginateQuery,
      chunkSize,
      this.getPaymentBaseQuery(payment),
    );
  }

  private getPaymentBaseQuery(
    payment: number,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    // Do not do payment if a registration has already one transaction for that payment number
    return this.registrationsBulkService
      .getBaseQuery()
      .leftJoin(
        'registration.latestTransactions',
        'latest_transaction_join',
        'latest_transaction_join.payment = :payment',
        { payment },
      )
      .andWhere('latest_transaction_join.id is null')
      .andWhere('registration.status = :status', {
        status: RegistrationStatusEnum.included,
      });
  }

  public async initiatePayment(
    userId: number,
    programId: number,
    payment: number,
    amount: number,
    referenceIds: string[],
    bulkSize: number,
  ): Promise<number> {
    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.paymentStarted,
    );

    const BATCH_SIZE = 1000;
    const paymentChunks = splitArrayIntoChunks(referenceIds, BATCH_SIZE);

    let paymentTransactionResult = 0;
    for (const chunk of paymentChunks) {
      const paPaymentDataList = await this.getPaymentList(
        chunk,
        amount,
        programId,
        userId,
        bulkSize,
      );

      const result = await this.payout(paPaymentDataList, programId, payment);

      paymentTransactionResult += result;
    }
    return paymentTransactionResult;
  }

  public async retryPayment(
    userId: number,
    programId: number,
    payment: number,
    referenceIdsDto?: ReferenceIdsDto,
  ): Promise<BulkActionResultRetryPaymentDto> {
    await this.checkPaymentInProgressAndThrow(programId);

    await this.getProgramWithFspOrThrow(programId);

    const paPaymentDataList = await this.getPaymentListForRetry(
      programId,
      payment,
      userId,
      referenceIdsDto?.referenceIds,
    );

    if (paPaymentDataList.length < 1) {
      const errors = 'There are no targeted PAs for this payment';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.paymentStarted,
    );

    void this.payout(paPaymentDataList, programId, payment)
      .catch((e) => {
        this.azureLogService.logError(e, true);
      })
      .finally(() => {
        void this.actionService.saveAction(
          userId,
          programId,
          AdditionalActionType.paymentFinished,
        );
      });

    const fspsInPayment: FinancialServiceProviderName[] = [];
    // This loop is pretty fast: with 131k registrations it takes ~38ms
    for (const registration of paPaymentDataList) {
      if (!fspsInPayment.includes(registration.fspName)) {
        fspsInPayment.push(registration.fspName);
      }
    }

    return {
      totalFilterCount: paPaymentDataList.length,
      applicableCount: paPaymentDataList.length,
      nonApplicableCount: 0,
      fspsInPayment,
    };
  }

  private async getProgramWithFspOrThrow(
    programId: number,
  ): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      relations: ['financialServiceProviders'],
    });
    if (!program) {
      const errors = 'Program not found.';
      // TODO: REFACTOR: Throw HTTPException from controller, as the Service "does not know" it is being called via HTTP.
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public async payout(
    paPaymentDataList: PaPaymentDataDto[],
    programId: number,
    payment: number,
  ): Promise<number> {
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    await this.makePaymentRequest(paLists, programId, payment);

    return paPaymentDataList.length;
  }

  public async checkPaymentInProgressAndThrow(
    programId: number,
  ): Promise<void> {
    if (await this.isPaymentInProgress(programId)) {
      throw new HttpException(
        { errors: 'Payment is already in progress' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async getProgramPaymentsStatus(
    programId: number,
  ): Promise<ProgramPaymentsStatusDto> {
    return {
      inProgress: await this.isPaymentInProgress(programId),
    };
  }

  private async isPaymentInProgress(programId: number): Promise<boolean> {
    // check progress based on actions-table first
    const actionsInProgress =
      await this.checkPaymentActionInProgress(programId);
    if (actionsInProgress) {
      return true;
    }

    // if not in progress, then also check progress from queue
    // get all FSPs in program
    const program = await this.getProgramWithFspOrThrow(programId);

    for (const fspEntity of program.financialServiceProviders) {
      if (await this.checkFspQueueProgress(fspEntity.fsp, programId)) {
        return true;
      }
    }

    return false;
  }

  private async checkPaymentActionInProgress(
    programId: number,
  ): Promise<boolean> {
    const latestPaymentStartedAction = await this.actionService.getLatestAction(
      programId,
      AdditionalActionType.paymentStarted,
    );
    // If never started, then not in progress, return early
    if (!latestPaymentStartedAction) {
      return false;
    }

    const latestPaymentFinishedAction =
      await this.actionService.getLatestAction(
        programId,
        AdditionalActionType.paymentFinished,
      );
    // If started, but never finished, then in progress
    if (!latestPaymentFinishedAction) {
      return true;
    }
    // If started and finished, then compare timestamps
    const startTimestamp = new Date(latestPaymentStartedAction?.created);
    const finishTimestamp = new Date(latestPaymentFinishedAction?.created);
    return finishTimestamp < startTimestamp;
  }

  private async checkFspQueueProgress(
    fsp: FinancialServiceProviderName,
    programId: number,
  ): Promise<boolean> {
    const service = this.fspWithQueueServiceMapping[fsp];
    // If no specific service for the FSP, assume no queue progress to check
    if (!service) {
      return false;
    }

    const programsWithFsp = await this.programRepository.find({
      where: {
        financialServiceProviders: {
          fsp: Equal(fsp),
        },
      },
    });
    const nrPending = await service.getQueueProgress(
      programsWithFsp.length > 0 ? programId : undefined,
    );
    return nrPending > 0;
  }

  private splitPaListByFsp(
    paPaymentDataList: PaPaymentDataDto[],
  ): SplitPaymentListDto {
    return paPaymentDataList.reduce(
      (acc: SplitPaymentListDto, paPaymentData) => {
        if (!acc[paPaymentData.fspName]) {
          acc[paPaymentData.fspName] = [];
        }
        acc[paPaymentData.fspName]!.push(paPaymentData);
        return acc;
      },
      {},
    );
  }

  private async makePaymentRequest(
    paLists: SplitPaymentListDto,
    programId: number,
    payment: number,
  ): Promise<void> {
    await Promise.all(
      Object.entries(paLists).map(async ([fsp, paPaymentList]) => {
        const [paymentService, useWhatsapp] =
          this.financialServiceProviderNameToServiceMap[fsp];
        return await paymentService.sendPayment(
          paPaymentList,
          programId,
          payment,
          useWhatsapp,
        );
      }),
    );
  }

  private failedTransactionForRegistrationAndPayment(
    q: ScopedQueryBuilder<RegistrationEntity>,
    payment: number,
  ): ScopedQueryBuilder<RegistrationEntity> {
    q.leftJoin(
      (qb) =>
        qb
          .from(TransactionEntity, 'transactions')
          .select('MAX("created")', 'created')
          .addSelect('"payment"', 'payment')
          .andWhere('"payment" = :payment', { payment })
          .groupBy('"payment"')
          .addSelect('"transactionStep"', 'transactionStep')
          .addGroupBy('"transactionStep"')
          .addSelect('"registrationId"', 'registrationId')
          .addGroupBy('"registrationId"'),
      'transaction_max_created',
      `transaction_max_created."registrationId" = registration.id`,
    )
      .leftJoin(
        'registration.transactions',
        'transaction',
        `transaction."registrationId" = transaction_max_created."registrationId"
      AND transaction.payment = transaction_max_created.payment
      AND transaction."transactionStep" = transaction_max_created."transactionStep"
      AND transaction."created" = transaction_max_created."created"
      AND transaction.status = '${TransactionStatusEnum.error}'`,
      )
      .addSelect([
        'transaction.amount AS "transactionAmount"',
        'transaction.id AS "transactionId"',
      ]);
    return q;
  }

  private getPaymentRegistrationsQuery(
    programId: number,
  ): ScopedQueryBuilder<RegistrationEntity> {
    const q = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select('"referenceId"')
      .addSelect('registration.id as id')
      .addSelect('fsp.fsp as "fspName"')
      .andWhere('registration."programId" = :programId', { programId })
      .leftJoin('registration.fsp', 'fsp');
    q.addSelect((subQuery) => {
      return subQuery
        .addSelect('value', 'paymentAddress')
        .from(RegistrationDataEntity, 'data')
        .leftJoin('data.fspQuestion', 'question')
        .andWhere('question.name IN (:...names)', {
          names: [
            CustomDataAttributes.phoneNumber,
            CustomDataAttributes.whatsappPhoneNumber,
          ],
        })
        .andWhere('data.registrationId = registration.id')
        .groupBy('data.id')
        .limit(1);
    }, 'paymentAddress');
    return q;
  }

  private async getPaymentListForRetry(
    programId: number,
    payment: number,
    userId: number,
    referenceIds?: string[],
  ): Promise<PaPaymentDataDto[]> {
    let q = this.getPaymentRegistrationsQuery(programId);
    q = this.failedTransactionForRegistrationAndPayment(q, payment);

    // If referenceIds passed, only retry those
    let rawResult;
    if (referenceIds && referenceIds.length > 0) {
      q.andWhere('registration."referenceId" IN (:...referenceIds)', {
        referenceIds,
      });
      rawResult = await q.getRawMany();
      for (const row of rawResult) {
        if (!row.transactionId) {
          const errors = `No failed transaction found for registration with referenceId ${row.referenceId}.`;
          throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
        }
      }
    } else {
      // If no referenceIds passed, retry all failed transactions for this payment
      // .. get all failed referenceIds for this payment
      const failedReferenceIds = (
        await this.transactionsService.getLastTransactions(
          programId,
          payment,
          undefined,
          TransactionStatusEnum.error,
        )
      ).map((t) => t.referenceId);
      // .. if nothing found, throw an error
      if (!failedReferenceIds.length) {
        const errors = 'No failed transactions found for this payment.';
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      q.andWhere('"referenceId" IN (:...failedReferenceIds)', {
        failedReferenceIds,
      });
      rawResult = await q.getRawMany();
    }
    const result: PaPaymentDataDto[] = [];
    for (const row of rawResult) {
      row['userId'] = userId;
      result.push(row);
    }
    return result;
  }

  private async getPaymentList(
    referenceIds: string[],
    amount: number,
    programId: number,
    userId: number,
    bulkSize: number,
  ): Promise<PaPaymentDataDto[]> {
    const q = this.getPaymentRegistrationsQuery(programId);
    q.addSelect('registration."paymentAmountMultiplier"');
    q.andWhere('registration."referenceId" IN (:...referenceIds)', {
      referenceIds,
    });
    const result = await q.getRawMany();
    const paPaymentDataList: PaPaymentDataDto[] = [];
    for (const row of result) {
      const paPaymentData: PaPaymentDataDto = {
        userId,
        transactionAmount: amount * row.paymentAmountMultiplier,
        referenceId: row.referenceId,
        paymentAddress: row.paymentAddress,
        fspName: row.fspName,
        bulkSize,
      };
      paPaymentDataList.push(paPaymentData);
    }
    return paPaymentDataList;
  }

  public async getImportInstructionsTemplate(
    programId: number,
  ): Promise<string[]> {
    const programWithReconciliationFsps = await this.programRepository.findOne({
      where: {
        id: Equal(programId),
        financialServiceProviders: {
          fsp: Equal(FinancialServiceProviderName.excel),
        },
      },
      relations: ['financialServiceProviders'],
      select: ['id'],
    });

    if (!programWithReconciliationFsps) {
      throw new HttpException('Program or FSP not found', HttpStatus.NOT_FOUND);
    }

    const matchColumn = await this.excelService.getImportMatchColumn(programId);
    return [matchColumn, 'status'];
  }

  public async getFspInstructions(
    programId: number,
    payment: number,
    userId: number,
  ): Promise<FspInstructions> {
    const exportPaymentTransactions = (
      await this.transactionsService.getLastTransactions(programId, payment)
    ).filter(
      (t) =>
        t.fspIntegrationType !== FinancialServiceProviderIntegrationType.api,
    );

    if (exportPaymentTransactions.length === 0) {
      throw new HttpException(
        'No transactions found for this payment with FSPs that require to download payment instructions.',
        HttpStatus.NOT_FOUND,
      );
    }

    let csvInstructions: CsvInstructions = [];
    let fileType: ExportFileType | undefined;

    // REFACTOR: below code seems to facilitate multiple non-api FSPs in 1 payment, but does not actually handle this correctly.
    // REFACTOR: below code should be transformed to paginate-queries instead of per PA, like the Excel-FSP code below
    for await (const transaction of exportPaymentTransactions.filter(
      (t) => t.fsp !== FinancialServiceProviderName.excel,
    )) {
      const registration =
        await this.registrationScopedRepository.findOneOrFail({
          where: { referenceId: Equal(transaction.referenceId) },
          relations: ['fsp'],
        });

      if (
        // For fsp's with reconciliation export only export waiting transactions
        registration.fsp.hasReconciliation &&
        transaction.status !== TransactionStatusEnum.waiting
      ) {
        continue;
      }
    }

    // It is assumed the Excel FSP is not combined with other non-api FSPs above, and they are overwritten
    const excelTransactions = exportPaymentTransactions.filter(
      (t) =>
        t.fsp === FinancialServiceProviderName.excel &&
        t.status === TransactionStatusEnum.waiting, // only 'waiting' given that Excel FSP has reconciliation
    );
    if (excelTransactions.length) {
      csvInstructions = await this.excelService.getFspInstructions(
        excelTransactions,
        programId,
        payment,
      );
      fileType = ExportFileType.excel;
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.exportFspInstructions,
    );

    return {
      data: csvInstructions,
      fileType,
    };
  }

  public async importFspReconciliationData(
    file: Blob,
    programId: number,
    payment: number,
    userId: number,
  ): Promise<ImportResult> {
    // REFACTOR: below code seems to facilitate multiple non-api FSPs in 1 payment, but does not actually handle this correctly.
    const programWithReconciliationFsps =
      await this.programRepository.findOneOrFail({
        where: {
          id: Equal(programId),
          financialServiceProviders: { hasReconciliation: Equal(true) },
        },
        relations: ['financialServiceProviders'],
      });

    let importResponseRecords: any[] = [];
    for await (const fsp of programWithReconciliationFsps.financialServiceProviders) {
      if (fsp.fsp === FinancialServiceProviderName.excel) {
        const maxRecords = 10000;
        const matchColumn =
          await this.excelService.getImportMatchColumn(programId);
        const excelRegistrations =
          await this.excelService.getRegistrationsForReconciliation(
            programId,
            payment,
            matchColumn,
          );
        if (!excelRegistrations?.length) {
          continue;
        }
        const validatedExcelImport = await this.fileImportService.validateCsv(
          file,
          maxRecords,
        );
        const transactions = await this.transactionsService.getLastTransactions(
          programId,
          payment,
          undefined,
          undefined,
          FinancialServiceProviderName.excel,
        );
        importResponseRecords =
          this.excelService.joinRegistrationsAndImportRecords(
            excelRegistrations,
            validatedExcelImport,
            matchColumn,
            transactions,
          );
      }
    }

    let countPaymentSuccess = 0;
    let countPaymentFailed = 0;
    let countNotFound = 0;
    const transactionsToSave: any[] = [];
    for (const importResponseRecord of importResponseRecords) {
      if (!importResponseRecord.paTransactionResult) {
        importResponseRecord.importStatus = ImportStatus.notFound;
        countNotFound += 1;
        continue;
      }

      transactionsToSave.push(importResponseRecord.paTransactionResult);
      importResponseRecord.importStatus = ImportStatus.imported;
      countPaymentSuccess += Number(
        importResponseRecord.paTransactionResult.status ===
          TransactionStatusEnum.success,
      );
      countPaymentFailed += Number(
        importResponseRecord.paTransactionResult.status ===
          TransactionStatusEnum.error,
      );
      delete importResponseRecord.paTransactionResult;
    }

    if (transactionsToSave.length) {
      const transactionRelationDetails = {
        programId,
        paymentNr: payment,
        userId,
      };
      await this.transactionsService.storeAllTransactionsBulk(
        transactionsToSave,
        transactionRelationDetails,
      );
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.importFspReconciliation,
    );

    return {
      importResult: importResponseRecords,
      aggregateImportResult: {
        countPaymentFailed,
        countPaymentSuccess,
        countNotFound,
      },
    };
  }
}
