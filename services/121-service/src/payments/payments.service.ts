import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { DataSource, In, Repository } from 'typeorm';
import { AdditionalActionType } from '../actions/action.entity';
import { ActionService } from '../actions/action.service';
import { FspIntegrationType } from '../fsp/enum/fsp-integration-type.enum';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { FspService } from '../fsp/fsp.service';
import { ProgramEntity } from '../programs/program.entity';
import {
  BulkActionResultDto,
  BulkActionResultPaymentDto,
} from '../registration/dto/bulk-action-result.dto';
import {
  ImportResult,
  ImportStatus,
} from '../registration/dto/bulk-import.dto';
import { ReferenceIdsDto } from '../registration/dto/reference-id.dto';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '../registration/registration-scoped.repository';
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { RegistrationsImportService } from '../registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '../registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '../scoped.repository';
import { StatusEnum } from '../shared/enum/status.enum';
import { AzureLogService } from '../shared/services/azure-log.service';
import { RegistrationDataEntity } from './../registration/registration-data.entity';
import { RegistrationsBulkService } from './../registration/services/registrations-bulk.service';
import { ExportFileType, FspInstructions } from './dto/fsp-instructions.dto';
import { ImportFspReconciliationDto } from './dto/import-fsp-reconciliation.dto';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import { SplitPaymentListDto } from './dto/split-payment-lists.dto';
import { AfricasTalkingService } from './fsp-integration/africas-talking/africas-talking.service';
import { BelcashService } from './fsp-integration/belcash/belcash.service';
import { BobFinanceService } from './fsp-integration/bob-finance/bob-finance.service';
import { CommercialBankEthiopiaService } from './fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
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

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly actionService: ActionService,
    private readonly azureLogService: AzureLogService,
    private readonly fspService: FspService,
    private readonly transactionService: TransactionsService,
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
    private readonly registrationsImportService: RegistrationsImportService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
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

  private async aggregateTransactionsByDimension(
    dimension: string,
    programId: number,
    payment: number,
  ): Promise<any[]> {
    return await this.dataSource
      .createQueryBuilder()
      .select([dimension, 'COUNT(*) as count'])
      .from(
        '(' +
          this.transactionService
            .getLastTransactionsQuery(programId, payment)
            .getQuery() +
          ')',
        'transactions',
      )
      .setParameters(
        this.transactionService
          .getLastTransactionsQuery(programId, payment)
          .getParameters(),
      )
      .groupBy(dimension)
      .getRawMany();
  }

  public async getPaymentAggregation(
    programId: number,
    payment: number,
  ): Promise<PaymentReturnDto> {
    // Scoped, as this.transactionScopedRepository is used in the transaction.service.ts
    const statusAggregation = await this.aggregateTransactionsByDimension(
      'status',
      programId,
      payment,
    );

    let paymentInProgress = false;
    try {
      await this.checkPaymentInProgressAndThrow(programId, payment);
    } catch (error) {
      paymentInProgress = true;
    }

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
      paymentInProgress: paymentInProgress,
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
      await this.checkPaymentInProgressAndThrow(programId, payment);
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
      return { ...bulkActionResultDto, sumPaymentAmountMultiplier: 0 };
    }

    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(
        programId,
        payment,
        paginateQuery,
      );

    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    // This loop is pretty fast: with 100.000 registrations it takes ~12ms
    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
    }
    const bulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
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
  ): Promise<RegistrationViewEntity[]> {
    const chunkSize = 50000;
    paginateQuery.limit = chunkSize;
    paginateQuery.page = 1;
    let totalPages = 1;

    let allRegistrations: RegistrationViewEntity[] = [];

    for (let i = 0; i < totalPages; i++) {
      const registrationsForPayment =
        await this.registrationsPaginationService.getPaginate(
          paginateQuery,
          programId,
          true,
          false,
          this.getPaymentBaseQuery(payment), // We need to create a seperate querybuilder object twice or it will be modified twice
        );
      totalPages = registrationsForPayment.meta.totalPages;
      paginateQuery.page = paginateQuery.page + 1;
      allRegistrations = allRegistrations.concat(
        ...registrationsForPayment.data,
      );
    }
    return allRegistrations;
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

    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < referenceIds.length; i += chunkSize) {
      chunks.push(referenceIds.slice(i, i + chunkSize));
    }

    let paymentTransactionResult = 0;
    for (const chunk of chunks) {
      const paPaymentDataList = await this.getPaymentList(
        chunk,
        amount,
        programId,
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
  ): Promise<BulkActionResultDto> {
    await this.checkPaymentInProgressAndThrow(programId, payment);

    await this.checkProgram(programId);

    const paPaymentDataList = await this.getPaymentListForRetry(
      programId,
      payment,
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

    return {
      totalFilterCount: paPaymentDataList.length,
      applicableCount: paPaymentDataList.length,
      nonApplicableCount: 0,
    };
  }

  private async checkProgram(programId: number): Promise<ProgramEntity> {
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
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    await this.makePaymentRequest(paLists, programId, payment);

    return paPaymentDataList.length;
  }

  // TODO: refactor this to use 1 query + include payment-id in action-table
  public async checkPaymentInProgressAndThrow(
    programId: number,
    payment?: number,
  ): Promise<void> {
    let inProgress = false;
    const latestPaymentStartedAction =
      await this.actionService.getLatestActions(
        programId,
        AdditionalActionType.paymentStarted,
      );
    // If never started, then not in progress, return early
    if (!latestPaymentStartedAction) {
      return;
    }

    const latestPaymentFinishedAction =
      await this.actionService.getLatestActions(
        programId,
        AdditionalActionType.paymentFinished,
      );
    // If started, but never finished, then in progress
    if (!latestPaymentFinishedAction) {
      inProgress = true;
    } else {
      // If started and finished, then compare timestamps
      const startTimestamp = new Date(latestPaymentStartedAction?.created);
      const finishTimestamp = new Date(latestPaymentFinishedAction?.created);
      if (finishTimestamp < startTimestamp) {
        // If latest finished-timestamp before latest start-timstamp, then in progress
        inProgress = true;
      } else {
        // get all FSPs in payment
        const fspAggregation = await this.aggregateTransactionsByDimension(
          'fsp',
          programId,
          payment,
        );

        for (const fsp of fspAggregation) {
          if (fsp.fsp === FspName.intersolveVisa) {
            const programsWithVisa = await this.programRepository.find({
              where: {
                financialServiceProviders: { fsp: FspName.intersolveVisa },
              },
            });
            const nrPending = await this.intersolveVisaService.getQueueProgress(
              programsWithVisa.length > 1 ? programId : null, // only make query program-specific if there are multiple programs using this fsp
            );
            if (nrPending > 0) {
              inProgress = true;
              break; // if one fsp is in progress, then the whole payment is in progress
            }
          } else if (
            fsp.fsp === FspName.intersolveVoucherPaper ||
            fsp.fsp === FspName.intersolveVoucherWhatsapp
          ) {
            const programsWithVoucher = await this.programRepository.find({
              where: {
                financialServiceProviders: {
                  fsp: In([
                    FspName.intersolveVoucherWhatsapp,
                    FspName.intersolveVoucherPaper,
                  ]),
                },
              },
            });
            const nrPending =
              await this.intersolveVoucherService.getQueueProgress(
                programsWithVoucher.length > 1 ? programId : null, // only make query program-specific if there are multiple programs using this fsp
              );
            if (nrPending > 0) {
              inProgress = true;
              break; // if one fsp is in progress, then the whole payment is in progress
            }
          } else if (fsp.fsp === FspName.safaricom) {
            const programsWithSafaricom = await this.programRepository.find({
              where: {
                financialServiceProviders: { fsp: FspName.safaricom },
              },
            });
            const nrPending = await this.safaricomService.getQueueProgress(
              programsWithSafaricom.length > 1 ? programId : null, // only make query program-specific if there are multiple programs using this fsp
            );
            if (nrPending > 0) {
              inProgress = true;
              break; // if one fsp is in progress, then the whole payment is in progress
            }
          } else if (fsp.fsp === FspName.commercialBankEthiopia) {
            const programsWithCommercialBankEthiopia =
              await this.programRepository.find({
                where: {
                  financialServiceProviders: {
                    fsp: FspName.commercialBankEthiopia,
                  },
                },
              });
            const nrPending =
              await this.commercialBankEthiopiaService.getQueueProgress(
                programsWithCommercialBankEthiopia.length > 1
                  ? programId
                  : null, // only make query program-specific if there are multiple programs using this fsp
              );
            if (nrPending > 0) {
              inProgress = true;
              break; // if one fsp is in progress, then the whole payment is in progress
            }
          }
          // for fsp's without queue, do nothing, so inProgress remains false
        }
      }
    }

    if (inProgress) {
      const errors = 'Payment is already in progress';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    return;
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
    for (const paPaymentData of paPaymentDataList) {
      if (paPaymentData.fspName === FspName.intersolveVoucherWhatsapp) {
        intersolvePaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.intersolveVoucherPaper) {
        intersolveNoWhatsappPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.intersolveVisa) {
        intersolveVisaPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.intersolveJumboPhysical) {
        intersolveJumboPhysicalPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.africasTalking) {
        africasTalkingPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.belcash) {
        belcashPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.bobFinance) {
        bobFinancePaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.ukrPoshta) {
        ukrPoshtaPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.vodacash) {
        vodacashPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.safaricom) {
        safaricomPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.commercialBankEthiopia) {
        commercialBankEthiopiaPaPayment.push(paPaymentData);
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
    };
  }

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
      await this.intersolveVisaService.sendPayment(
        paLists.intersolveVisaPaPayment,
        programId,
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
  }

  private async getRegistrationsForReconsiliation(
    programId: number,
    payment: number,
  ): Promise<RegistrationEntity[]> {
    const waitingReferenceIds = (
      await this.transactionService.getLastTransactions(
        programId,
        payment,
        null,
        StatusEnum.waiting,
      )
    ).map((t) => t.referenceId);
    return await this.registrationScopedRepository.find({
      where: { referenceId: In(waitingReferenceIds) },
      relations: ['fsp'],
    });
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
    referenceIds?: string[],
  ): Promise<PaPaymentDataDto[]> {
    let q = this.getPaymentRegistrationsQuery(programId);
    q = this.failedTransactionForRegistrationAndPayment(q, payment);

    // If referenceIds passed, only retry those
    if (referenceIds && referenceIds.length > 0) {
      q.andWhere('registration."referenceId" IN (:...referenceIds)', {
        referenceIds: referenceIds,
      });
      const result = await q.getRawMany();
      for (const row of result) {
        if (!row.transactionId) {
          const errors = `No failed transaction found for registration with referenceId ${row.referenceId}.`;
          throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
        }
      }
      return result;
    } else {
      // If no referenceIds passed, retry all failed transactions for this payment
      // .. get all failed referenceIds for this payment
      const failedReferenceIds = (
        await this.transactionService.getLastTransactions(
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
      const result = await q.getRawMany();
      return result;
    }
  }

  private async getPaymentList(
    referenceIds: string[],
    amount: number,
    programId: number,
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
    programId,
    payment,
    userId: number,
  ): Promise<FspInstructions> {
    const paymentTransactions =
      await this.transactionService.getLastTransactions(
        programId,
        payment,
        null,
        null,
      );

    const csvInstructions = [];
    let xmlInstructions: string;

    let fileType: ExportFileType;

    for await (const transaction of paymentTransactions) {
      const registration = await this.registrationScopedRepository.findOne({
        where: { referenceId: transaction.referenceId },
        relations: ['fsp'],
      });

      if (
        // For fsp's with reconciliation upload (= xml at the moment) only export waiting transactions
        registration.fsp.integrationType === FspIntegrationType.xml &&
        transaction.status !== StatusEnum.waiting
      ) {
        continue;
      }

      if (registration.fsp.fsp === FspName.bobFinance) {
        const instruction = await this.bobFinanceService.getFspInstructions(
          registration,
          transaction,
        );
        csvInstructions.push(instruction);
        if (!fileType) {
          fileType = ExportFileType.csv;
        }
      }
      if (registration.fsp.fsp === FspName.ukrPoshta) {
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
      if (registration.fsp.fsp === FspName.vodacash) {
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
    fspIds: number[],
    userId: number,
  ): Promise<ImportResult> {
    let countPaymentSuccess = 0;
    let countPaymentFailed = 0;
    let countNotFound = 0;
    let paTransactionResult, record, importResponseRecord;
    const validatedImport = await this.xmlToValidatedFspReconciliation(file);
    const validatedImportRecords = validatedImport.validatedArray;
    const registrationsPerPayment =
      await this.getRegistrationsForReconsiliation(programId, payment);
    const importResponseRecords = [];
    for await (const registration of registrationsPerPayment) {
      for await (const fspId of fspIds) {
        const fsp = await this.fspService.getFspById(fspId);

        if (fsp.fsp === FspName.vodacash) {
          record = await this.vodacashService.findReconciliationRecord(
            registration,
            validatedImportRecords,
          );
          paTransactionResult =
            await this.vodacashService.createTransactionResult(
              registration,
              record,
              programId,
              payment,
            );
        }

        if (!paTransactionResult) {
          importResponseRecord.importStatus = ImportStatus.notFound;
          importResponseRecords.push(importResponseRecord);
          countNotFound += 1;
          continue;
        }

        await this.transactionService.storeTransactionUpdateStatus(
          paTransactionResult,
          programId,
          payment,
        );
        countPaymentSuccess += Number(
          paTransactionResult.status === StatusEnum.success,
        );
        countPaymentFailed += Number(
          paTransactionResult.status === StatusEnum.error,
        );
      }
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.importFspReconciliation,
    );

    return {
      importResult: importResponseRecords,
      aggregateImportResult: {
        countImported: validatedImport.recordsCount,
        countPaymentStarted: registrationsPerPayment.length,
        countPaymentFailed,
        countPaymentSuccess,
        countNotFound,
      },
    };
  }

  private async xmlToValidatedFspReconciliation(
    xmlFile,
  ): Promise<ImportFspReconciliationDto> {
    const importRecords =
      await this.registrationsImportService.validateXml(xmlFile);
    return await this.validateFspReconciliationXmlInput(importRecords);
  }

  private async validateFspReconciliationXmlInput(
    xmlArray,
  ): Promise<ImportFspReconciliationDto> {
    const validatedArray = [];
    let recordsCount = 0;
    for (const row of xmlArray) {
      recordsCount += 1;
      if (this.registrationsImportService.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      const importRecord = this.vodacashService.validateReconciliationData(row);
      validatedArray.push(importRecord);
    }
    return {
      validatedArray,
      recordsCount,
    };
  }
}
