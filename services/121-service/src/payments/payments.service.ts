import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { AdditionalActionType } from '../actions/action.entity';
import { ActionService } from '../actions/action.service';
import { FspIntegrationType } from '../fsp/enum/fsp-integration-type.enum';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { FspService } from '../fsp/fsp.service';
import { ProgramEntity } from '../programs/program.entity';
import {
  ImportResult,
  ImportStatus,
} from '../registration/dto/bulk-import.dto';
import { ReferenceIdsDto } from '../registration/dto/reference-id.dto';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../registration/registration.entity';
import { BulkImportService } from '../registration/services/bulk-import.service';
import { StatusEnum } from '../shared/enum/status.enum';
import { RegistrationDataEntity } from './../registration/registration-data.entity';
import { ExportFileType, FspInstructions } from './dto/fsp-instructions.dto';
import { ImportFspReconciliationDto } from './dto/import-fsp-reconciliation.dto';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import { SplitPaymentListDto } from './dto/split-payment-lists.dto';
import { UnusedVoucherDto } from './dto/unused-voucher.dto';
import { VoucherWithBalanceDto } from './dto/voucher-with-balance.dto';
import { AfricasTalkingService } from './fsp-integration/africas-talking/africas-talking.service';
import { BelcashService } from './fsp-integration/belcash/belcash.service';
import { BobFinanceService } from './fsp-integration/bob-finance/bob-finance.service';
import { IntersolveJumboService } from './fsp-integration/intersolve-jumbo/intersolve-jumbo.service';
import { IntersolveVisaService } from './fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveIssueVoucherRequestEntity } from './fsp-integration/intersolve-voucher/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherService } from './fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { UkrPoshtaService } from './fsp-integration/ukrposhta/ukrposhta.service';
import { VodacashService } from './fsp-integration/vodacash/vodacash.service';
import { TransactionEntity } from './transactions/transaction.entity';
import { TransactionsService } from './transactions/transactions.service';

@Injectable()
export class PaymentsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private readonly actionService: ActionService,
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
    private readonly bulkImportService: BulkImportService,
  ) {}

  public async getPayments(programId: number): Promise<
    {
      payment: number;
      paymentDate: Date | string;
      amount: number;
    }[]
  > {
    const payments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('payment')
      .addSelect('MIN(transaction.created)', 'paymentDate')
      .where('transaction.program.id = :programId', {
        programId: programId,
      })
      .groupBy('payment')
      .getRawMany();
    return payments;
  }

  public async createPayment(
    userId: number,
    programId: number,
    payment: number,
    amount: number,
    referenceIdsDto: ReferenceIdsDto,
  ): Promise<number> {
    await this.checkProgram(programId);
    const paPaymentDataList = await this.getPaymentList(
      referenceIdsDto.referenceIds,
      amount,
      programId,
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

    const paymentTransactionResult = await this.payout(
      paPaymentDataList,
      programId,
      payment,
      userId,
    );

    return paymentTransactionResult;
  }

  public async retryPayment(
    userId: number,
    programId: number,
    payment: number,
    referenceIdsDto?: ReferenceIdsDto,
  ): Promise<number> {
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

    const paymentTransactionResult = await this.payout(
      paPaymentDataList,
      programId,
      payment,
      userId,
    );

    return paymentTransactionResult;
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
    userId: number,
  ): Promise<number> {
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    this.makePaymentRequest(paLists, programId, payment).catch((e) => {
      console.warn(e);
    });
    if (payment > -1) {
      this.actionService.saveAction(
        userId,
        programId,
        AdditionalActionType.paymentFinished,
      );
    }
    return paPaymentDataList.length;
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
  }

  private async getRegistrationsForReconsiliation(
    programId: number,
    payment: number,
  ): Promise<RegistrationEntity[]> {
    const waitingReferenceIds = (
      await this.getTransactionsByStatus(programId, payment, StatusEnum.waiting)
    ).map((t) => t.referenceId);
    return await this.registrationRepository.find({
      where: { referenceId: In(waitingReferenceIds) },
      relations: ['fsp'],
    });
  }

  private failedTransactionForRegistrationAndPayment(
    q: SelectQueryBuilder<RegistrationEntity>,
    payment: number,
  ): SelectQueryBuilder<RegistrationEntity> {
    q.leftJoin(
      (qb) =>
        qb
          .from(TransactionEntity, 'transactions')
          .select('MAX("created")', 'created')
          .addSelect('"payment"', 'payment')
          .where('"payment" = :payment', { payment })
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
  ): SelectQueryBuilder<RegistrationEntity> {
    const q = this.registrationRepository
      .createQueryBuilder('registration')
      .select('"referenceId"')
      .addSelect('registration.id as id')
      .addSelect('fsp.fsp as "fspName"')
      .where('registration."programId" = :programId', { programId })
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
        await this.getTransactionsByStatus(programId, payment, StatusEnum.error)
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
        transactionAmount: amount * (row.paymentAmountMultiplier || 1),
        referenceId: row.referenceId,
        paymentAddress: row.paymentAddress,
        fspName: row.fspName,
      };
      paPaymentDataList.push(paPaymentData);
    }
    return paPaymentDataList;
  }

  private async getTransactionsByStatus(
    programId: number,
    payment: number,
    status: StatusEnum,
  ): Promise<any[]> {
    const allLatestTransactionAttemptsPerPa =
      await this.transactionService.getTransactions(programId, false, payment);
    const failedTransactions = allLatestTransactionAttemptsPerPa.filter(
      (t) => t.payment === payment && t.status === status,
    );
    return failedTransactions;
  }

  public async getUnusedVouchers(
    programId?: number,
  ): Promise<UnusedVoucherDto[]> {
    return this.intersolveVoucherService.getUnusedVouchers(programId);
  }

  public async getVouchersWithBalance(
    programId: number,
  ): Promise<VoucherWithBalanceDto[]> {
    return this.intersolveVoucherService.getVouchersWithBalance(programId);
  }

  public async getToCancelVouchers(): Promise<
    IntersolveIssueVoucherRequestEntity[]
  > {
    return this.intersolveVoucherService.getToCancelVouchers();
  }

  public async getFspInstructions(
    programId,
    payment,
    userId: number,
  ): Promise<FspInstructions> {
    const transactions = await this.transactionService.getTransactions(
      programId,
      false,
    );
    const paymentTransactions = transactions.filter(
      (transaction) => transaction.payment === payment,
    );
    const csvInstructions = [];
    let xmlInstructions: string;

    let fileType: ExportFileType;

    for await (const transaction of paymentTransactions) {
      const registration = await this.registrationRepository.findOne({
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

    this.actionService.saveAction(
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

    this.actionService.saveAction(
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
    const importRecords = await this.bulkImportService.validateXml(xmlFile);
    return await this.validateFspReconciliationXmlInput(importRecords);
  }

  private async validateFspReconciliationXmlInput(
    xmlArray,
  ): Promise<ImportFspReconciliationDto> {
    const validatedArray = [];
    let recordsCount = 0;
    for (const row of xmlArray) {
      recordsCount += 1;
      if (this.bulkImportService.checkForCompletelyEmptyRow(row)) {
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
