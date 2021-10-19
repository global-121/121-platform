import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdditionalActionType } from '../actions/action.entity';
import { ActionService } from '../actions/action.service';
import { PaPaymentDataDto } from '../fsp/dto/pa-payment-data.dto';
import {
  FinancialServiceProviderEntity,
  FspName,
} from '../fsp/financial-service-provider.entity';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
} from './dto/get-transaction.dto';
import { ProgramEntity } from '../programs/program.entity';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { RegistrationEntity } from '../registration/registration.entity';
import { StatusEnum } from '../shared/enum/status.enum';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../fsp/dto/payment-transaction-result.dto';
import { FspService } from '../fsp/fsp.service';
import { AfricasTalkingNotificationDto } from './africas-talking/dto/africas-talking-notification.dto';
import { TwilioStatusCallbackDto } from '../notifications/twilio.dto';
import { UnusedVoucherDto } from '../fsp/dto/unused-voucher.dto';
import { AfricasTalkingService } from './africas-talking/africas-talking.service';
import { AfricasTalkingValidationDto } from './africas-talking/dto/africas-talking-validation.dto';
import { IntersolveService } from './intersolve/intersolve.service';
import { TransactionEntity } from './transactions/transaction.entity';

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
    private readonly intersolveService: IntersolveService,
    private readonly africasTalkingService: AfricasTalkingService,
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

  public async createTransactions(
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
    for (let paPaymentData of paPaymentDataList) {
      if (paPaymentData.fspName === FspName.intersolve) {
        intersolvePaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.intersolveNoWhatsapp) {
        intersolveNoWhatsappPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === FspName.africasTalking) {
        africasTalkingPaPayment.push(paPaymentData);
      } else {
        console.log('fsp does not exist: paPaymentData: ', paPaymentData);
        throw new HttpException('fsp does not exist.', HttpStatus.NOT_FOUND);
      }
    }
    return {
      intersolvePaPayment,
      intersolveNoWhatsappPaPayment,
      africasTalkingPaPayment,
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
    return {
      intersolveTransactionResult,
      intersolveNoWhatsappTransactionResult,
      africasTalkingTransactionResult,
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
    const allLatestTransactionAttemptsPerPa = await this.getTransactions(
      programId,
      false,
      payment,
    );
    const failedTransactions = allLatestTransactionAttemptsPerPa.filter(
      t => t.payment === payment && t.status === StatusEnum.error,
    );
    return failedTransactions;
  }

  public async getTransactions(
    programId: number,
    splitByTransactionStep: boolean,
    minPayment?: number,
  ): Promise<any> {
    const maxAttemptPerPaAndPayment = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(['payment', '"registrationId"'])
      .addSelect(
        `MAX(cast("transactionStep" as varchar) || '-' || cast(created as varchar)) AS max_attempt`,
      )
      .groupBy('payment')
      .addGroupBy('"registrationId"');

    if (splitByTransactionStep) {
      maxAttemptPerPaAndPayment
        .addSelect('"transactionStep"')
        .addGroupBy('"transactionStep"');
    }

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.created AS "paymentDate"',
        'transaction.payment AS payment',
        '"referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as error',
        'transaction.customData as "customData"',
      ])
      .leftJoin(
        '(' + maxAttemptPerPaAndPayment.getQuery() + ')',
        'subquery',
        `transaction.registrationId = subquery."registrationId" AND transaction.payment = subquery.payment AND cast(transaction."transactionStep" as varchar) || '-' || cast(created as varchar) = subquery.max_attempt`,
      )
      .leftJoin('transaction.registration', 'r')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.payment >= :minPayment', {
        minPayment: minPayment || 0,
      })
      .andWhere('subquery.max_attempt IS NOT NULL')
      .getRawMany();
    return transactions;
  }

  public async getTransaction(
    input: GetTransactionDto,
  ): Promise<GetTransactionOutputDto> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: input.referenceId },
    });

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.created AS "paymentDate"',
        'payment',
        '"referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as error',
        'transaction.customData as "customData"',
      ])
      .leftJoin('transaction.registration', 'c')
      .where('transaction.program.id = :programId', {
        programId: input.programId,
      })
      .andWhere('transaction.payment = :paymentId', {
        paymentId: input.payment,
      })
      .andWhere('transaction.registration.id = :registrationId', {
        registrationId: registration.id,
      })
      .orderBy('transaction.created', 'DESC')
      .getRawMany();
    if (transactions.length === 0) {
      return null;
    }
    if (input.customDataKey) {
      for (const transaction of transactions) {
        if (
          transaction.customData[input.customDataKey] === input.customDataValue
        ) {
          return transaction;
        }
      }
      return null;
    }
    for (const transaction of transactions) {
      if (
        !transaction.customData ||
        Object.keys(transaction.customData).length === 0
      ) {
        return transaction;
      }
    }
  }

  public async checkPaymentValidation(
    fsp: FspName,
    africasTalkingValidationData?: AfricasTalkingValidationDto,
  ): Promise<any> {
    if (fsp === FspName.africasTalking) {
      return this.africasTalkingService.checkValidation(
        africasTalkingValidationData,
      );
    }
  }

  public async getUnusedVouchers(): Promise<UnusedVoucherDto[]> {
    return this.intersolveService.getUnusedVouchers();
  }
}
