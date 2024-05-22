import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { DataSource, Repository } from 'typeorm';
import { AdditionalActionType } from '../actions/action.entity';
import { ActionsService } from '../actions/actions.service';
import { FinancialServiceProviderIntegrationType } from '../financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { FinancialServiceProviderName } from '../financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramEntity } from '../programs/program.entity';
import {
  BulkActionResultPaymentDto,
  BulkActionResultRetryPaymentDto,
} from '../registration/dto/bulk-action-result.dto';
import {
  ImportResult,
  ImportStatus,
} from '../registration/dto/bulk-import.dto';
import { ReferenceIdsDto } from '../registration/dto/reference-id.dto';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { RegistrationScopedRepository } from '../registration/repositories/registration-scoped.repository';
import { RegistrationsPaginationService } from '../registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '../scoped.repository';
import { StatusEnum } from '../shared/enum/status.enum';
import { AzureLogService } from '../shared/services/azure-log.service';
import { splitArrayIntoChunks } from '../utils/chunk.helper';
import { FileImportService } from '../utils/file-import/file-import.service';
import { RegistrationDataEntity } from './../registration/registration-data.entity';
import { RegistrationsBulkService } from './../registration/services/registrations-bulk.service';
import { ExportFileType, FspInstructions } from './dto/fsp-instructions.dto';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import { ProgramPaymentsStatusDto } from './dto/program-payments-status.dto';
import { SplitPaymentListDto } from './dto/split-payment-lists.dto';
import { TransactionRelationDetailsDto } from './dto/transaction-relation-details.dto';
import { AfricasTalkingService } from './fsp-integration/africas-talking/africas-talking.service';
import { BelcashService } from './fsp-integration/belcash/belcash.service';
import { BobFinanceService } from './fsp-integration/bob-finance/bob-finance.service';
import { CommercialBankEthiopiaService } from './fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { ExcelService } from './fsp-integration/excel/excel.service';
import { IntersolveJumboService } from './fsp-integration/intersolve-jumbo/intersolve-jumbo.service';
import { IntersolveVisaService } from './fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherService } from './fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { SafaricomService } from './fsp-integration/safaricom/safaricom.service';
import { UkrPoshtaService } from './fsp-integration/ukrposhta/ukrposhta.service';
import { VodacashService } from './fsp-integration/vodacash/vodacash.service';
import { PaymentReturnDto } from './transactions/dto/get-transaction.dto';
import { TransactionEntity } from './transactions/transaction.entity';
import { TransactionsService } from './transactions/transactions.service';

@Injectable()
export class PaymentsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  private fspWithQueueServiceMapping = {
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

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly actionService: ActionsService,
    private readonly azureLogService: AzureLogService,
    private readonly transactionsService: TransactionsService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly intersolveJumboService: IntersolveJumboService,
    private readonly africasTalkingService: AfricasTalkingService,
    private readonly belcashService: BelcashService,
    private readonly bobFinanceService: BobFinanceService,
    private readonly ukrPoshtaService: UkrPoshtaService,
    private readonly vodacashService: VodacashService,
    private readonly safaricomService: SafaricomService,
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly excelService: ExcelService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly fileImportService: FileImportService,
    private readonly dataSource: DataSource,
  ) {}

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
        programId: programId,
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
      .select(['status', 'COUNT(*) as count'])
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
    return {
      nrSuccess:
        statusAggregation.find((row) => row.status === StatusEnum.success)
          ?.count || 0,
      nrWaiting:
        statusAggregation.find((row) => row.status === StatusEnum.waiting)
          ?.count || 0,
      nrError:
        statusAggregation.find((row) => row.status === StatusEnum.error)
          ?.count || 0,
    };
  }

  public async postPayment(
    userId: number,
    programId: number,
    payment: number,
    amount: number,
    query: PaginateQuery,
    dryRun: boolean,
  ): Promise<BulkActionResultPaymentDto> {
    if (!dryRun) {
      await this.checkPaymentInProgressAndThrow(programId);
    }

    // TODO: REFACTOR: Move what happens in setQueryPropertiesBulkAction into this function, and call a refactored version of getBulkActionResult/getPaymentBaseQuery (create solution design first)
    const paginateQuery =
      this.registrationsBulkService.setQueryPropertiesBulkAction(query, true);

    // Fill bulkActionResultDto with meta data of the payment being done
    const bulkActionResultDto =
      await this.registrationsBulkService.getBulkActionResult(
        paginateQuery,
        programId,
        this.getPaymentBaseQuery(payment), // We need to create a seperate querybuilder object twice or it will be modified twice
      );

    // TODO: What is happening here? In which situation(s) does !amount evaluate to TRUE and what happens then?
    if (!amount) {
      return {
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        fspsInPayment: [],
      };
    }

    // Get array of RegistrationViewEntity objects to be paid
    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(
        programId,
        payment,
        paginateQuery,
      );

    // Calculate the totalMultiplierSum and create an array with all FSPs for this payment
    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    const fspsInPayment = [];
    // This loop is pretty fast: with 131k registrations it takes ~38ms
    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
      if (
        !dryRun && // This is only needed in actual doPayment call
        !fspsInPayment.includes(registration.financialServiceProvider)
      ) {
        fspsInPayment.push(registration.financialServiceProvider);
      }
    }

    // Fill bulkActionResultPaymentDto with bulkActionResultDto and additional payment specific data
    // TODO: REFACTOR: The definition of this DTO should live in its own file.
    const bulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      fspsInPayment: fspsInPayment,
    };

    // Create an array of referenceIds to be paid
    const referenceIds = registrationsForPayment.map(
      (registration) => registration.referenceId,
    );

    if (!dryRun && referenceIds.length > 0) {
      // TODO: REFACTOR: userId not be passed down, but should be available in a context object; registrationsForPayment.length is redundant, as it is the same as referenceIds.length
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
  ): Promise<RegistrationViewEntity[]> {
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

    // Split the referenceIds into chunks of 1000, to prevent heap out of memory errors
    const BATCH_SIZE = 1000;
    const paymentChunks = splitArrayIntoChunks(referenceIds, BATCH_SIZE);

    let paymentTransactionResult = 0;
    for (const chunk of paymentChunks) {
      // TODO: REFACTOR: Registration and related data was already retrieved in postPayment, why first strip it down to referenceids and then retrieve it again?
      // Get the PA data for the payment
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

    const fspsInPayment = [];
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
      where: { id: programId },
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
    // Create an object with an array of PA data for each FSP
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    await this.makePaymentRequest(paLists, programId, payment);

    return paPaymentDataList.length;
  }

  // TODO: REFACTOR: This method can be private
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
    // TODO: REFACTOR: Remove this call, as we want to remove the Actions Module altogether.
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
    // TODO: REFACTOR: Use the Redis way of determining if a payment is in progress, see function this.checkFspQueueProgress
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
    fsp: string,
    programId: number,
  ): Promise<boolean> {
    const service = this.fspWithQueueServiceMapping[fsp];
    // If no specific service for the FSP, assume no queue progress to check
    if (!service) {
      return false;
    }

    const programsWithFsp = await this.programRepository.find({
      where: { financialServiceProviders: { fsp: fsp } },
    });
    const nrPending = await service.getQueueProgress(
      programsWithFsp.length > 0 ? programId : null,
    );
    return nrPending > 0;
  }

  private splitPaListByFsp(
    paPaymentDataList: PaPaymentDataDto[],
  ): SplitPaymentListDto {
    const intersolvePaPayment = [];
    const intersolveNoWhatsappPaPayment = [];
    const intersolveVisaPaPayment = [];
    const intersolveJumboPhysicalPaPayment = [];
    const africasTalkingPaPayment = [];
    const belcashPaPayment = [];
    const bobFinancePaPayment = [];
    const ukrPoshtaPaPayment = [];
    const vodacashPaPayment = [];
    const safaricomPaPayment = [];
    const commercialBankEthiopiaPaPayment = [];
    const excelPaPayment = [];
    for (const paPaymentData of paPaymentDataList) {
      if (
        paPaymentData.fspName ===
        FinancialServiceProviderName.intersolveVoucherWhatsapp
      ) {
        intersolvePaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName ===
        FinancialServiceProviderName.intersolveVoucherPaper
      ) {
        intersolveNoWhatsappPaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName === FinancialServiceProviderName.intersolveVisa
      ) {
        intersolveVisaPaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName ===
        FinancialServiceProviderName.intersolveJumboPhysical
      ) {
        intersolveJumboPhysicalPaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName === FinancialServiceProviderName.africasTalking
      ) {
        africasTalkingPaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName === FinancialServiceProviderName.belcash
      ) {
        belcashPaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName === FinancialServiceProviderName.bobFinance
      ) {
        bobFinancePaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName === FinancialServiceProviderName.ukrPoshta
      ) {
        ukrPoshtaPaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName === FinancialServiceProviderName.vodacash
      ) {
        vodacashPaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName === FinancialServiceProviderName.safaricom
      ) {
        safaricomPaPayment.push(paPaymentData);
      } else if (
        paPaymentData.fspName ===
        FinancialServiceProviderName.commercialBankEthiopia
      ) {
        commercialBankEthiopiaPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FinancialServiceProviderName.excel) {
        excelPaPayment.push(paPaymentData);
      } else {
        console.log('fsp does not exist: paPaymentData: ', paPaymentData);
        throw new HttpException('fsp does not exist.', HttpStatus.NOT_FOUND);
      }
    }
    return {
      intersolvePaPayment,
      intersolveNoWhatsappPaPayment,
      intersolveVisaPaPayment,
      intersolveJumboPhysicalPaPayment,
      africasTalkingPaPayment,
      belcashPaPayment,
      bobFinancePaPayment,
      ukrPoshtaPaPayment,
      vodacashPaPayment,
      safaricomPaPayment,
      commercialBankEthiopiaPaPayment,
      excelPaPayment,
    };
  }

  // TODO: REFACTOR: This method does not make payment requests, but results in jobs added to queues. Rename to reflect this.
  private async makePaymentRequest(
    paLists: any,
    programId: number,
    payment: number,
  ): Promise<any> {
    if (paLists.intersolveJumboPhysicalPaPayment.length) {
      await this.intersolveJumboService.sendPayment(
        paLists.intersolveJumboPhysicalPaPayment,
        programId,
        payment,
      );
    }

    if (paLists.intersolvePaPayment.length) {
      await this.intersolveVoucherService.sendPayment(
        paLists.intersolvePaPayment,
        programId,
        payment,
        true,
      );
    }
    if (paLists.intersolveNoWhatsappPaPayment.length) {
      await this.intersolveVoucherService.sendPayment(
        paLists.intersolveNoWhatsappPaPayment,
        programId,
        payment,
        false,
      );
    }

    if (paLists.intersolveVisaPaPayment.length) {
      /* 
        TODO: REFACTOR: We need to refactor the Payments Service during segregation of duties implementation, so that the Payments Service calls a private function per FSP with a list of ReferenceIds (or RegistrationIds ?!)
        which then gathers the necessary data to create transfer jobs for the FSP.
        
        Until then, we do a temporary hack here for Intersolve Visa, pretending there's only referenceIds in paLists.intersolveVisaPaPayment. The only thing is we do not know here if this is a retry.
        See this.createIntersolveVisaTransferJobs() of how this is handled.
      */

      // TODO: Double check if paLists.intersolveVisaPaPayment[0].transactionAmount indeed contains the payment amount and is not already multiplied by the paymentAmountMultiplier. If not, add paymentAmount as parameter to this makePaymentRequest function.
      await this.createAndAddIntersolveVisaTransferJobs(
        paLists.intersolveVisaPaPayment,
        programId,
        paLists.intersolveVisaPaPayment[0].transactionAmount,
        payment,
      );
    }

    if (paLists.africasTalkingPaPayment.length) {
      await this.africasTalkingService.sendPayment(
        paLists.africasTalkingPaPayment,
        programId,
        payment,
      );
    }

    if (paLists.belcashPaPayment.length) {
      await this.belcashService.sendPayment(
        paLists.belcashPaPayment,
        programId,
        payment,
      );
    }

    if (paLists.safaricomPaPayment.length) {
      await this.safaricomService.sendPayment(
        paLists.safaricomPaPayment,
        programId,
        payment,
      );
    }

    if (paLists.bobFinancePaPayment.length) {
      await this.bobFinanceService.sendPayment(
        paLists.bobFinancePaPayment,
        programId,
        payment,
      );
    }

    if (paLists.ukrPoshtaPaPayment.length) {
      await this.ukrPoshtaService.sendPayment(
        paLists.ukrPoshtaPaPayment,
        programId,
        payment,
      );
    }

    if (paLists.vodacashPaPayment.length) {
      await this.vodacashService.sendPayment(
        paLists.vodacashPaPayment,
        programId,
        payment,
      );
    }

    if (paLists.commercialBankEthiopiaPaPayment.length) {
      await this.commercialBankEthiopiaService.sendPayment(
        paLists.commercialBankEthiopiaPaPayment,
        programId,
        payment,
      );
    }

    if (paLists.excelPaPayment.length) {
      await this.excelService.sendPayment(
        paLists.excelPaPayment,
        programId,
        payment,
      );
    }
  }

  // TODO: Needed to add _'s to allow unused parameters, as this function is not yet implemented
  private async createAndAddIntersolveVisaTransferJobs(
    referenceIds: string[],
    _programId: number,
    _paymentAmount: number,
    _paymentNumber: number,
  ): Promise<void> {
    /* TODO: continue implementing this function:
    - Call getPaymentListForRetry to determine if this is a retry attempt, then get the transfer amount from the transaction instead of calculating it with paymentAmountMultiplier. REFACTOR: with segregation of duties implementation.
    - Get necessary PA data (see getPaPaymentDetails etc. logic in IntersolveVisaService.sendPayment)
    - Map PA data to FSP specific DTO: CreateIntersolveVisaTransferJobDto, see Miro for how the DTO will look like
    - Call to be created TransferQueues.addIntersolveVisaTransferJobs(createIntersolveVisaTransferJobDto[])
    */

    // TODO: Fill with the list of fields we want
    // TODO: Get these fieldNames from the FinancialServiceProviderQuestions
    const dataFieldNames = [];

    // Get necessary Registration and RegistrationData data
    await this.registrationScopedRepository.getRegistrationsWithData(
      referenceIds,
      dataFieldNames,
    );
    // TODO: Map name dynamically with the help of ProgramFinancialServiceProviderConfigurations
    // TODO: Add missing call to addIntersolveVisaTransferJobs() here
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
      AND transaction.status = '${StatusEnum.error}'`,
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
        referenceIds: referenceIds,
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
          null,
          StatusEnum.error,
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
      referenceIds: referenceIds,
    });
    const result = await q.getRawMany();
    const paPaymentDataList: PaPaymentDataDto[] = [];
    for (const row of result) {
      const paPaymentData: PaPaymentDataDto = {
        userId: userId,
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

    let csvInstructions = [];
    let xmlInstructions: string;
    let fileType: ExportFileType;

    // REFACTOR: below code seems to facilitate multiple non-api FSPs in 1 payment, but does not actually handle this correctly.
    // REFACTOR: below code should be transformed to paginate-queries instead of per PA, like the Excel-FSP code below
    for await (const transaction of exportPaymentTransactions.filter(
      (t) => t.fsp !== FinancialServiceProviderName.excel,
    )) {
      const registration = await this.registrationScopedRepository.findOne({
        where: { referenceId: transaction.referenceId },
        relations: ['fsp'],
      });

      if (
        // For fsp's with reconciliation export only export waiting transactions
        registration.fsp.hasReconciliation &&
        transaction.status !== StatusEnum.waiting
      ) {
        continue;
      }

      if (registration.fsp.fsp === FinancialServiceProviderName.bobFinance) {
        const instruction = await this.bobFinanceService.getFspInstructions(
          registration,
          transaction,
        );
        csvInstructions.push(instruction);
        if (!fileType) {
          fileType = ExportFileType.csv;
        }
      }
      if (registration.fsp.fsp === FinancialServiceProviderName.ukrPoshta) {
        const instruction = await this.ukrPoshtaService.getFspInstructions(
          registration,
          transaction,
        );
        if (!fileType) {
          fileType = ExportFileType.excel;
        }
        if (instruction) {
          csvInstructions.push(instruction);
        }
      }
      if (registration.fsp.fsp === FinancialServiceProviderName.vodacash) {
        xmlInstructions = await this.vodacashService.getFspInstructions(
          registration,
          transaction,
          xmlInstructions,
        );
        if (!fileType) {
          fileType = ExportFileType.xml;
        }
      }
    }

    // It is assumed the Excel FSP is not combined with other non-api FSPs above, and they are overwritten
    const excelTransactions = exportPaymentTransactions.filter(
      (t) =>
        t.fsp === FinancialServiceProviderName.excel &&
        t.status === StatusEnum.waiting, // only 'waiting' given that Excel FSP has reconciliation
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
      data: fileType === ExportFileType.xml ? xmlInstructions : csvInstructions,
      fileType: fileType,
    };
  }

  public async importFspReconciliationData(
    file,
    programId: number,
    payment: number,
    userId: number,
  ): Promise<ImportResult> {
    // REFACTOR: below code seems to facilitate multiple non-api FSPs in 1 payment, but does not actually handle this correctly.
    const programWithReconciliationFsps = await this.programRepository.findOne({
      where: {
        id: programId,
        financialServiceProviders: { hasReconciliation: true },
      },
      relations: ['financialServiceProviders'],
    });

    let importResponseRecords = [];
    for await (const fsp of programWithReconciliationFsps.financialServiceProviders) {
      if (fsp.fsp === FinancialServiceProviderName.vodacash) {
        const vodacashRegistrations =
          await this.vodacashService.getRegistrationsForReconciliation(
            programId,
            payment,
          );
        if (!vodacashRegistrations?.length) {
          continue;
        }
        const validatedVodacashImport =
          await this.vodacashService.xmlToValidatedFspReconciliation(file);
        for (const record of validatedVodacashImport) {
          const matchedRegistration =
            await this.vodacashService.findReconciliationRegistration(
              record,
              vodacashRegistrations,
            );
          if (matchedRegistration) {
            record['paTransactionResult'] =
              await this.vodacashService.createTransactionResult(
                matchedRegistration.id,
                matchedRegistration.referenceId,
                record,
                programId,
                payment,
              );
          }
          importResponseRecords.push(record);
        }
      }

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
          null,
          null,
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
    const transactionsToSave = [];
    for (const importResponseRecord of importResponseRecords) {
      if (!importResponseRecord.paTransactionResult) {
        importResponseRecord.importStatus = ImportStatus.notFound;
        countNotFound += 1;
        continue;
      }

      transactionsToSave.push(importResponseRecord.paTransactionResult);
      importResponseRecord.importStatus = ImportStatus.imported;
      countPaymentSuccess += Number(
        importResponseRecord.paTransactionResult.status === StatusEnum.success,
      );
      countPaymentFailed += Number(
        importResponseRecord.paTransactionResult.status === StatusEnum.error,
      );
      delete importResponseRecord.paTransactionResult;
    }

    if (transactionsToSave.length) {
      const transactionRelationDetails: TransactionRelationDetailsDto = {
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
