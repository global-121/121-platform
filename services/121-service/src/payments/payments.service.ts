import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AdditionalActionType } from '../actions/action.entity';
import { ActionService } from '../actions/action.service';
import { FspName } from '../fsp/financial-service-provider.entity';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { FspService } from '../fsp/fsp.service';
import { ProgramEntity } from '../programs/program.entity';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { RegistrationEntity } from '../registration/registration.entity';
import { StatusEnum } from '../shared/enum/status.enum';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import { FspTransactionResultDto } from './dto/payment-transaction-result.dto';
import { UnusedVoucherDto } from './dto/unused-voucher.dto';
import { AfricasTalkingService } from './fsp-integration/africas-talking/africas-talking.service';
import { BelcashService } from './fsp-integration/belcash/belcash.service';
import { IntersolveService } from './fsp-integration/intersolve/intersolve.service';
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
    referenceId?: string,
  ): Promise<number> {
    let program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    if (!program || program.phase === 'design') {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const targetedRegistrations = await this.getRegistrationsForPayment(
      programId,
      payment,
      referenceId,
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
      payment === -1
        ? AdditionalActionType.testMpesaPayment
        : AdditionalActionType.paymentStarted,
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

  private splitPaListByFsp(paPaymentDataList: PaPaymentDataDto[]): any {
    const intersolvePaPayment = [];
    const intersolveNoWhatsappPaPayment = [];
    const africasTalkingPaPayment = [];
    const belcashPaPayment = [];
    for (let paPaymentData of paPaymentDataList) {
      if (paPaymentData.fspName === FspName.intersolve) {
        intersolvePaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.intersolveNoWhatsapp) {
        intersolveNoWhatsappPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.africasTalking) {
        africasTalkingPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.belcash) {
        belcashPaPayment.push(paPaymentData);
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
    };
  }

  private async makePaymentRequest(
    paLists: any,
    programId: number,
    payment: number,
    amount: number,
  ): Promise<any> {
    let intersolveTransactionResult = new FspTransactionResultDto();
    if (paLists.intersolvePaPayment.length) {
      intersolveTransactionResult = await this.intersolveService.sendPayment(
        paLists.intersolvePaPayment,
        true,
        amount,
        payment,
      );
    } else {
      intersolveTransactionResult.paList = [];
    }
    let intersolveNoWhatsappTransactionResult = new FspTransactionResultDto();
    if (paLists.intersolveNoWhatsappPaPayment.length) {
      intersolveNoWhatsappTransactionResult = await this.intersolveService.sendPayment(
        paLists.intersolveNoWhatsappPaPayment,
        false,
        amount,
        payment,
      );
    } else {
      intersolveNoWhatsappTransactionResult.paList = [];
    }
    let africasTalkingTransactionResult = new FspTransactionResultDto();
    if (paLists.africasTalkingPaPayment.length) {
      africasTalkingTransactionResult = await this.africasTalkingService.sendPayment(
        paLists.africasTalkingPaPayment,
        programId,
        payment,
        amount,
      );
    } else {
      africasTalkingTransactionResult.paList = [];
    }

    let belcashTransactionResult = new FspTransactionResultDto();
    if (paLists.belcashPaPayment.length) {
      belcashTransactionResult = await this.belcashService.sendPayment(
        paLists.belcashPaPayment,
        programId,
        payment,
        amount,
      );
    } else {
      belcashTransactionResult.paList = [];
    }
    return {
      intersolveTransactionResult,
      intersolveNoWhatsappTransactionResult,
      africasTalkingTransactionResult,
      belcashTransactionResult,
    };
  }

  private async getRegistrationsForPayment(
    programId: number,
    payment: number,
    referenceId?: string,
  ): Promise<RegistrationEntity[]> {
    const knownPayment = await this.transactionRepository.findOne({
      where: { payment: payment },
    });
    let failedRegistrations;
    if (knownPayment) {
      const failedReferenceIds = (
        await this.getFailedTransactions(programId, payment)
      ).map(t => t.referenceId);
      failedRegistrations = await this.registrationRepository.find({
        where: { referenceId: In(failedReferenceIds) },
        relations: ['fsp'],
      });
    }

    // If 'referenceId' is passed (only in retry-payment-per PA) use this PA only,
    // If known payment, then only failed registrations
    // otherwise (new payment) get all included PA's
    return referenceId
      ? await this.registrationRepository.find({
          where: { referenceId: referenceId },
          relations: ['fsp'],
        })
      : knownPayment
      ? failedRegistrations
      : await this.getIncludedRegistrations(programId);
  }

  private async getIncludedRegistrations(
    programId: number,
  ): Promise<RegistrationEntity[]> {
    return await this.registrationRepository.find({
      where: {
        program: { id: programId },
        registrationStatus: RegistrationStatusEnum.included,
      },
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
      // NOTE: this is ugly, but spent too much time already on how to automate this..
      if (fsp.fsp === FspName.intersolve) {
        paPaymentData.fspName = FspName.intersolve;
      } else if (fsp.fsp === FspName.intersolveNoWhatsapp) {
        paPaymentData.fspName = FspName.intersolveNoWhatsapp;
      } else if (fsp.fsp === FspName.africasTalking) {
        paPaymentData.fspName = FspName.africasTalking;
      } else if (fsp.fsp === FspName.belcash) {
        paPaymentData.fspName = FspName.belcash;
      }
      paPaymentData.paymentAddress = await this.getPaymentAddress(
        includedRegistration,
        fsp.attributes,
      );
      paPaymentData.paymentAmountMultiplier =
        includedRegistration.paymentAmountMultiplier;

      paPaymentDataList.push(paPaymentData);
    }
    return paPaymentDataList;
  }

  private async getPaymentAddress(
    includedRegistration: RegistrationEntity,
    fspAttributes: FspAttributeEntity[],
  ): Promise<null | string> {
    for (let attribute of fspAttributes) {
      // NOTE: this is still not ideal, as it is hard-coded. No other quick solution was found.
      if (
        attribute.name === CustomDataAttributes.phoneNumber ||
        attribute.name === CustomDataAttributes.whatsappPhoneNumber
      ) {
        const paymentAddressColumn = attribute.name;
        return includedRegistration.customData[paymentAddressColumn];
      }
    }
    return null;
  }

  private async getFailedTransactions(
    programId: number,
    payment: number,
  ): Promise<any> {
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
}
