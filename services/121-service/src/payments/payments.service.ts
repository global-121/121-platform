import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdditionalActionType } from '../actions/action.entity';
import { ActionService } from '../actions/action.service';
import { FspIntegrationType } from '../fsp/enum/fsp-integration-type.enum';
import { FspName } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { FspService } from '../fsp/fsp.service';
import { ProgramEntity } from '../programs/program.entity';
import {
  ImportFspReconciliationResult,
  ImportResult,
  ImportStatus,
} from '../registration/dto/bulk-import.dto';
import { ReferenceIdsDto } from '../registration/dto/reference-id.dto';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../registration/registration.entity';
import { BulkImportService } from '../registration/services/bulk-import.service';
import { StatusEnum } from '../shared/enum/status.enum';
import { ExportFileType, FspInstructions } from './dto/fsp-instructions.dto';
import { ImportFspReconciliationDto } from './dto/import-fsp-reconciliation.dto';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import { SplitPaymentListDto } from './dto/split-payment-lists.dto';
import { UnusedVoucherDto } from './dto/unused-voucher.dto';
import { AfricasTalkingService } from './fsp-integration/africas-talking/africas-talking.service';
import { BelcashService } from './fsp-integration/belcash/belcash.service';
import { BobFinanceService } from './fsp-integration/bob-finance/bob-finance.service';
import { IntersolveRequestEntity } from './fsp-integration/intersolve/intersolve-request.entity';
import { IntersolveService } from './fsp-integration/intersolve/intersolve.service';
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
    private readonly intersolveService: IntersolveService,
    private readonly africasTalkingService: AfricasTalkingService,
    private readonly belcashService: BelcashService,
    private readonly bobFinanceService: BobFinanceService,
    private readonly ukrPoshtaService: UkrPoshtaService,
    private readonly vodacashService: VodacashService,
    private readonly bulkImportService: BulkImportService,
  ) {}

  public async getPayments(
    programId: number,
  ): Promise<
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
      .addSelect(
        'MIN(transaction.amount / coalesce(r.paymentAmountMultiplier, 1) )',
        'amount',
      )
      .leftJoin('transaction.registration', 'r')
      .where('transaction.program.id = :programId', { programId: programId })
      .groupBy('payment')
      .getRawMany();
    return payments;
  }

  public async createPayment(
    userId: number,
    programId: number,
    payment: number,
    amount: number,
    referenceIdsDto?: ReferenceIdsDto,
  ): Promise<number> {
    let program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const targetedRegistrations = await this.getRegistrationsForPayment(
      programId,
      payment,
      referenceIdsDto,
    );

    if (targetedRegistrations.length < 1) {
      const errors = 'There are no targeted PAs for this payment';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const paPaymentDataList = await this.createPaPaymentDataList(
      targetedRegistrations,
    );

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.paymentStarted,
    );

    const paymentTransactionResult = await this.payout(
      paPaymentDataList,
      programId,
      payment,
      amount,
      userId,
    );

    return paymentTransactionResult;
  }

  public async payout(
    paPaymentDataList: PaPaymentDataDto[],
    programId: number,
    payment: number,
    amount: number,
    userId: number,
  ): Promise<number> {
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    this.makePaymentRequest(paLists, programId, payment, amount).then(() => {
      if (payment > -1) {
        this.actionService.saveAction(
          userId,
          programId,
          AdditionalActionType.paymentFinished,
        );
      }
    });
    return paPaymentDataList.length;
  }

  private splitPaListByFsp(
    paPaymentDataList: PaPaymentDataDto[],
  ): SplitPaymentListDto {
    const intersolvePaPayment = [];
    const intersolveNoWhatsappPaPayment = [];
    const africasTalkingPaPayment = [];
    const belcashPaPayment = [];
    const bobFinancePaPayment = [];
    const ukrPoshtaPaPayment = [];
    const vodacashPaPayment = [];
    for (let paPaymentData of paPaymentDataList) {
      if (paPaymentData.fspName === FspName.intersolve) {
        intersolvePaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.intersolveNoWhatsapp) {
        intersolveNoWhatsappPaPayment.push(paPaymentData);
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
    amount: number,
  ): Promise<any> {
    if (paLists.intersolvePaPayment.length) {
      await this.intersolveService.sendPayment(
        paLists.intersolvePaPayment,
        true,
        amount,
        payment,
      );
    }
    if (paLists.intersolveNoWhatsappPaPayment.length) {
      await this.intersolveService.sendPayment(
        paLists.intersolveNoWhatsappPaPayment,
        false,
        amount,
        payment,
      );
    }

    if (paLists.africasTalkingPaPayment.length) {
      await this.africasTalkingService.sendPayment(
        paLists.africasTalkingPaPayment,
        programId,
        payment,
        amount,
      );
    }

    if (paLists.belcashPaPayment.length) {
      await this.belcashService.sendPayment(
        paLists.belcashPaPayment,
        programId,
        payment,
        amount,
      );
    }

    if (paLists.bobFinancePaPayment.length) {
      await this.bobFinanceService.sendPayment(
        paLists.bobFinancePaPayment,
        programId,
        payment,
        amount,
      );
    }

    if (paLists.ukrPoshtaPaPayment.length) {
      await this.ukrPoshtaService.sendPayment(
        paLists.ukrPoshtaPaPayment,
        programId,
        payment,
        amount,
      );
    }

    if (paLists.vodacashPaPayment.length) {
      await this.vodacashService.sendPayment(
        paLists.vodacashPaPayment,
        programId,
        payment,
        amount,
      );
    }
  }

  private async getRegistrationsForPayment(
    programId: number,
    payment: number,
    referenceIdsDto?: ReferenceIdsDto,
  ): Promise<RegistrationEntity[]> {
    if (referenceIdsDto) {
      return await this.registrationRepository.find({
        where: { referenceId: In(referenceIdsDto.referenceIds) },
        relations: ['fsp'],
      });
    }

    // If no referenceIds passed, this must be because of the 'retry all failed' scenario ..
    const failedReferenceIds = (
      await this.getFailedTransactions(programId, payment)
    ).map(t => t.referenceId);
    // .. if nothing found, throw an error
    if (!failedReferenceIds.length) {
      const errors = 'No failed transactions found for this payment.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    return await this.registrationRepository.find({
      where: { referenceId: In(failedReferenceIds) },
      relations: ['fsp'],
    });
  }

  private async createPaPaymentDataList(
    includedRegistrations: RegistrationEntity[],
  ): Promise<PaPaymentDataDto[]> {
    let paPaymentDataList = [];
    for (let includedRegistration of includedRegistrations) {
      const paPaymentData = new PaPaymentDataDto();
      paPaymentData.referenceId = includedRegistration.referenceId;
      const fsp = await this.fspService.getFspById(includedRegistration.fsp.id);
      paPaymentData.fspName = fsp.fsp as FspName;
      paPaymentData.paymentAddress = await this.getPaymentAddress(
        includedRegistration,
        fsp.questions,
      );
      paPaymentData.paymentAmountMultiplier =
        includedRegistration.paymentAmountMultiplier;

      paPaymentDataList.push(paPaymentData);
    }
    return paPaymentDataList;
  }

  private async getPaymentAddress(
    includedRegistration: RegistrationEntity,
    fspAttributes: FspQuestionEntity[],
  ): Promise<null | string> {
    for (let attribute of fspAttributes) {
      // NOTE: this is still not ideal, as it is hard-coded. No other quick solution was found.
      if (
        attribute.name === CustomDataAttributes.phoneNumber ||
        attribute.name === CustomDataAttributes.whatsappPhoneNumber
      ) {
        const paymentAddressColumn = attribute.name;
        return await includedRegistration.getRegistrationDataValueByName(
          paymentAddressColumn,
        );
      }
    }
    return null;
  }

  private async getFailedTransactions(
    programId: number,
    payment: number,
  ): Promise<any[]> {
    const allLatestTransactionAttemptsPerPa = await this.transactionService.getTransactions(
      programId,
      false,
      payment,
    );
    const failedTransactions = allLatestTransactionAttemptsPerPa.filter(
      t => t.payment === payment && t.status === StatusEnum.error,
    );
    return failedTransactions;
  }

  public async getUnusedVouchers(): Promise<UnusedVoucherDto[]> {
    return this.intersolveService.getUnusedVouchers();
  }

  public async getToCancelVouchers(): Promise<IntersolveRequestEntity[]> {
    return this.intersolveService.getToCancelVouchers();
  }

  public async getFspInstructions(
    programId,
    payment,
  ): Promise<FspInstructions> {
    const transactions = await this.transactionService.getTransactions(
      programId,
      false,
    );
    const paymentTransactions = transactions.filter(
      transaction => transaction.payment === payment,
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
    console.log('file: ', file);
    const validatedImportRecords = await this.xmlToValidatedFspReconciliation(
      file,
    );
    let countImported = 0;
    let countNotFound = 0;
    let countPaymentSuccess = 0;
    let countPaymentFailed = 0;

    const importResponseRecords = [];

    console.log('validatedImportRecords[0]: ', validatedImportRecords[0]);
    for await (const record of validatedImportRecords) {
      const importResponseRecord = record as ImportFspReconciliationResult;

      let registration, paTransactionResult;
      // Loop over potentially multiple fsp's in same dataset
      for (const fspId of fspIds) {
        const fsp = await this.fspService.getFspById(fspId);

        if (fsp.fsp === FspName.vodacash) {
          registration = null; //DUMMY > REMOVE
          // const registration = await this.vodacashService.findRegistrationFromInput(
          //   record,
          // );
          if (registration) {
            paTransactionResult = null; //DUMMY > REMOVE
            // const paTransactionResult = await this.vodacashService.uploadReconciliationData(
            //   registration,
            //   record,
            //   programId,
            // );
          }
        } else {
          continue;
        }
      }

      if (!registration) {
        importResponseRecord.importStatus = ImportStatus.notFound;
        importResponseRecords.push(importResponseRecord);
        countNotFound += 1;
        continue;
      }

      await this.transactionService.storeTransaction(
        paTransactionResult,
        programId,
        payment,
      );

      // This assumes that status is always 'success' or 'error', which should indeed be the case
      importResponseRecord.importStatus =
        paTransactionResult.status === StatusEnum.error
          ? ImportStatus.paymentFailed
          : ImportStatus.paymentSuccess;
      importResponseRecords.push(importResponseRecord);
      countImported += 1;
      countPaymentSuccess += Number(
        paTransactionResult.status === StatusEnum.success,
      );
      countPaymentFailed += Number(
        paTransactionResult.status === StatusEnum.error,
      );
    }

    this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.importFspReconciliation,
    );

    return {
      importResult: importResponseRecords,
      aggregateImportResult: {
        countImported,
        countPaymentFailed,
        countPaymentSuccess,
        countNotFound,
      },
    };
  }

  private async xmlToValidatedFspReconciliation(
    xmlFile,
  ): Promise<ImportFspReconciliationDto[]> {
    const importRecords = await this.bulkImportService.validateXml(xmlFile);
    return await this.validateFspReconciliationXmlInput(importRecords);
  }

  private async validateFspReconciliationXmlInput(
    xmlArray,
  ): Promise<ImportFspReconciliationDto[]> {
    const errors = [];
    const validatatedArray = [];
    for (const [i, row] of xmlArray.entries()) {
      if (this.bulkImportService.checkForCompletelyEmptyRow(row)) {
        continue;
      }

      const importRecord = this.vodacashService.validateReconciliationData(row);

      console.log('importRecord: ', importRecord);
      // const result = await validate(importRecord);
      // if (result.length > 0) {
      //   const errorObj = {
      //     lineNumber: i + 1,
      //     column: result[0].property,
      //     value: result[0].value,
      //   };
      //   errors.push(errorObj);
      //   throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      // }
      validatatedArray.push(importRecord);
    }
    return validatatedArray;
  }
}
