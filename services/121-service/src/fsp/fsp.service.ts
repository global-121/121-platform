import { AfricasTalkingService } from './africas-talking.service';
import { IntersolveService } from './intersolve.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  fspName,
  FinancialServiceProviderEntity,
} from './financial-service-provider.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { TransactionEntity } from '../programs/transactions.entity';
import { AfricasTalkingNotificationEntity } from './africastalking-notification.entity';
import { UpdateFspAttributeDto, UpdateFspDto } from './api/dto/update-fsp.dto';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from './dto/payment-transaction-result.dto';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import { ExportedVoucherDto } from './dto/exported-voucher.dto';
import { ActionService } from '../actions/action.service';
import { AdditionalActionType } from '../actions/action.entity';
import { TwilioStatusCallbackDto } from '../notifications/twilio.dto';
import { RegistrationEntity } from '../registration/registration.entity';

@Injectable()
export class FspService {
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  @InjectRepository(FspAttributeEntity)
  public fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(AfricasTalkingNotificationEntity)
  public africasTalkingNotificationRepository: Repository<
    AfricasTalkingNotificationEntity
  >;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private readonly africasTalkingService: AfricasTalkingService,
    private readonly intersolveService: IntersolveService,
    private readonly actionService: ActionService,
  ) {}

  public async payout(
    paPaymentDataList: PaPaymentDataDto[],
    programId: number,
    installment: number,
    amount: number,
    userId: number,
  ): Promise<number> {
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    this.makePaymentRequest(paLists, programId, installment, amount).then(
      transactionResults => {
        this.storeAllTransactions(transactionResults, programId, installment);
        if (installment > -1) {
          this.actionService.saveAction(
            userId,
            programId,
            AdditionalActionType.paymentFinished,
          );
        }
      },
    );
    return paPaymentDataList.length;
  }

  private splitPaListByFsp(paPaymentDataList: PaPaymentDataDto[]): any {
    const intersolvePaPayment = [];
    const intersolveNoWhatsappPaPayment = [];
    const africasTalkingPaPayment = [];
    for (let paPaymentData of paPaymentDataList) {
      if (paPaymentData.fspName === fspName.intersolve) {
        intersolvePaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === fspName.intersolveNoWhatsapp) {
        intersolveNoWhatsappPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === fspName.africasTalking) {
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
    installment: number,
    amount: number,
  ): Promise<any> {
    let intersolveTransactionResult = new FspTransactionResultDto();
    if (paLists.intersolvePaPayment.length) {
      intersolveTransactionResult = await this.intersolveService.sendPayment(
        paLists.intersolvePaPayment,
        true,
        amount,
        installment,
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
        installment,
      );
    } else {
      intersolveNoWhatsappTransactionResult.paList = [];
    }
    let africasTalkingTransactionResult = new FspTransactionResultDto();
    if (paLists.africasTalkingPaPayment.length) {
      africasTalkingTransactionResult = await this.africasTalkingService.sendPayment(
        paLists.africasTalkingPaPayment,
        programId,
        installment,
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

  private async storeAllTransactions(
    transactionResults: any,
    programId: number,
    installment: number,
  ): Promise<void> {
    // Intersolve transactions are now stored during PA-request-loop already
    // Align across FSPs in future again
    for (let transaction of transactionResults.africasTalkingTransactionResult
      .paList) {
      await this.storeTransaction(
        transaction,
        programId,
        installment,
        fspName.africasTalking,
      );
    }
  }

  private async storeTransaction(
    transactionResponse: PaTransactionResultDto,
    programId: number,
    installment: number,
    fspName: fspName,
  ): Promise<void> {
    const program = await this.programRepository.findOne(programId);
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { fsp: fspName },
    });
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: transactionResponse.referenceId },
    });

    const transaction = new TransactionEntity();
    transaction.amount = transactionResponse.calculatedAmount;
    transaction.created = transactionResponse.date || new Date();
    transaction.registration = registration;
    transaction.financialServiceProvider = fsp;
    transaction.program = program;
    transaction.installment = installment;
    transaction.status = transactionResponse.status;
    transaction.errorMessage = transactionResponse.message;
    transaction.customData = transactionResponse.customData;
    transaction.transactionStep = 1;

    this.transactionRepository.save(transaction);
  }

  public async checkPaymentValidation(
    fsp: fspName,
    africasTalkingValidationData?: AfricasTalkingValidationDto,
  ): Promise<any> {
    if (fsp === fspName.africasTalking) {
      return this.africasTalkingService.checkValidation(
        africasTalkingValidationData,
      );
    }
  }

  public async processPaymentStatus(
    fsp: fspName,
    statusCallbackData: object,
  ): Promise<void> {
    if (fsp === fspName.africasTalking) {
      const africasTalkingNotificationData = statusCallbackData as AfricasTalkingNotificationDto;
      const enrichedNotification = await this.africasTalkingService.processNotification(
        africasTalkingNotificationData,
      );

      this.storeTransaction(
        enrichedNotification.paTransactionResult,
        enrichedNotification.programId,
        enrichedNotification.installment,
        fspName.africasTalking,
      );
    }
    if (fsp === fspName.intersolve) {
      const twilioStatusCallbackData = statusCallbackData as TwilioStatusCallbackDto;
      await this.intersolveService.processStatus(twilioStatusCallbackData);
    }
  }

  public async getUnusedVouchers(): Promise<ExportedVoucherDto[]> {
    return this.intersolveService.getUnusedVouchers();
  }

  public async getVouchersToCancel(): Promise<ExportedVoucherDto[]> {
    return this.intersolveService.getVouchersToCancel();
  }

  public async getFspById(id: number): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne(id, {
      relations: ['attributes'],
    });
    return fsp;
  }

  public async updateFsp(
    updateFspDto: UpdateFspDto,
  ): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { fsp: updateFspDto.fsp },
    });
    if (!fsp) {
      const errors = `No fsp found with name ${updateFspDto.fsp}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let key in updateFspDto) {
      if (key !== 'fsp') {
        fsp[key] = updateFspDto[key];
      }
    }

    await this.financialServiceProviderRepository.save(fsp);
    return fsp;
  }

  public async updateFspAttribute(
    updateFspAttributeDto: UpdateFspAttributeDto,
  ): Promise<FspAttributeEntity> {
    const fspAttributes = await this.fspAttributeRepository.find({
      where: { name: updateFspAttributeDto.name },
      relations: ['fsp'],
    });
    // Filter out the right fsp, if fsp-attribute name occurs across multiple fsp's
    const fspAttribute = fspAttributes.filter(
      a => a.fsp.fsp === updateFspAttributeDto.fsp,
    )[0];
    if (!fspAttribute) {
      const errors = `No fspAttribute found with name ${updateFspAttributeDto.name} in fsp with name ${updateFspAttributeDto.fsp}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let key in updateFspAttributeDto) {
      if (key !== 'name' && key !== 'fsp') {
        fspAttribute[key] = updateFspAttributeDto[key];
      }
    }

    await this.fspAttributeRepository.save(fspAttribute);
    return fspAttribute;
  }
}
