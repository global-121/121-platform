import { IntersolvePayoutStatus } from './api/enum/intersolve-payout-status.enum';
import { IntersolveIssueCardResponse } from './api/dto/intersolve-issue-card-response.dto';
import { WhatsappService } from './../../notifications/whatsapp/whatsapp.service';
import {
  Injectable,
  HttpException,
  HttpStatus,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { IntersolveApiService } from './api/instersolve.api.service';
import { StatusEnum } from '../../shared/enum/status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, Not, IsNull } from 'typeorm';
import { IntersolveBarcodeEntity } from './intersolve-barcode.entity';
import { ProgramEntity } from '../program/program.entity';
import { IntersolveResultCode } from './api/enum/intersolve-result-code.enum';
import crypto from 'crypto';
import { ImageCodeService } from '../../notifications/imagecode/image-code.service';
import { IntersolveInstructionsEntity } from './intersolve-instructions.entity';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
  PaymentAddressTransactionResultDto,
} from './dto/payment-transaction-result.dto';
import {
  PaPaymentDataAggregateDto,
  PaPaymentDataDto,
} from './dto/pa-payment-data.dto';
import { UnusedVoucherDto } from './dto/unused-voucher.dto';
import { TransactionEntity } from '../program/transactions.entity';
import { IntersolveRequestEntity } from './intersolve-request.entity';
import { TwilioStatusCallbackDto } from '../../notifications/twilio.dto';
import { fspName } from './financial-service-provider.entity';
import { RegistrationEntity } from '../../registration/registration.entity';

@Injectable()
export class IntersolveService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;
  @InjectRepository(IntersolveInstructionsEntity)
  private readonly intersolveInstructionsRepository: Repository<
    IntersolveInstructionsEntity
  >;
  @InjectRepository(IntersolveRequestEntity)
  private readonly intersolveRequestRepository: Repository<
    IntersolveRequestEntity
  >;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;

  private readonly programId = 1;

  public constructor(
    private readonly intersolveApiService: IntersolveApiService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly imageCodeService: ImageCodeService,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    useWhatsapp: boolean,
    amount: number,
    installment: number,
  ): Promise<FspTransactionResultDto> {
    const result = new FspTransactionResultDto();
    result.paList = [];

    const paPaymentDataAggregate = this.aggregatePaPaymentListToPhoneNumber(
      paPaymentList,
      !!process.env.DISABLE_GROUPING_ON_PHONENUMBER,
    );

    for (let paymentInfo of paPaymentDataAggregate) {
      const paymentAddressLevelResult = await this.sendPaymentsPerPhoneNumber(
        paymentInfo,
        useWhatsapp,
        amount,
        installment,
      );
      // Assign phoneNumber level transaction results back to each PA
      paymentAddressLevelResult.paTransactionResultList.forEach(
        async paResult => {
          result.paList.push(paResult);
          // If 'waiting' then transaction is stored already earlier, to make sure it's there before status-callback comes in
          if (paResult.status !== StatusEnum.waiting) {
            const registration = await this.registrationRepository.findOne({
              select: ['id'],
              where: { referenceId: paResult.referenceId },
            });
            await this.insertTransactionIntersolve(
              installment,
              paResult.calculatedAmount,
              registration.id,
              1,
              paResult.status,
              paResult.message,
            );
          }
        },
      );
    }
    result.fspName = paPaymentList[0].fspName;
    return result;
  }

  private aggregatePaPaymentListToPhoneNumber(
    paPaymentList: PaPaymentDataDto[],
    groupingDisabled: boolean,
  ): PaPaymentDataAggregateDto[] {
    const groupsByPaymentAddress: PaPaymentDataAggregateDto[] = [];
    paPaymentList.forEach(paPaymentData => {
      if (
        // Join PA in existing group when ..
        !groupingDisabled && // .. grouping is not disabled
        paPaymentData.paymentAddress && // .. paymentAddress (whatsappPhoneNumber) is filled, so that no-whatsapp (paymentAddress = null) is not put in 1 group
        groupsByPaymentAddress // .. there is an existing group to join to
          .map(i => i.paymentAddress)
          .includes(paPaymentData.paymentAddress)
      ) {
        groupsByPaymentAddress
          .find(i => i.paymentAddress === paPaymentData.paymentAddress)
          .paPaymentDataList.push(paPaymentData);
      } else {
        groupsByPaymentAddress.push({
          paymentAddress: paPaymentData.paymentAddress,
          paPaymentDataList: [paPaymentData],
        });
      }
    });
    return groupsByPaymentAddress;
  }

  private getMultipliedAmount(amount: number, multiplier: number): number {
    return amount * (multiplier || 1);
  }

  public async sendPaymentsPerPhoneNumber(
    paymentInfo: PaPaymentDataAggregateDto,
    useWhatsapp: boolean,
    amount: number,
    installment: number,
  ): Promise<PaymentAddressTransactionResultDto> {
    let transactionResult = new PaymentAddressTransactionResultDto();
    transactionResult.paymentAddress = paymentInfo.paymentAddress;
    transactionResult.paTransactionResultList = [];

    // First loop over all PA's with same phone number and do all voucher-level stuff
    const voucherInfoArray = [];
    for await (let paPaymentData of paymentInfo.paPaymentDataList) {
      const voucherResult = new PaTransactionResultDto();
      voucherResult.referenceId = paPaymentData.referenceId;

      const intersolveRefPos = this.getIntersolveRefPos();
      const calculatedAmount = this.getMultipliedAmount(
        amount,
        paPaymentData.paymentAmountMultiplier,
      );
      voucherResult.calculatedAmount = calculatedAmount;
      const voucherInfo = await this.issueVoucher(
        calculatedAmount,
        intersolveRefPos,
      );
      voucherInfo.refPos = intersolveRefPos;

      if (voucherInfo.resultCode == IntersolveResultCode.Ok) {
        voucherInfo.voucher = await this.storeVoucher(
          voucherInfo,
          paPaymentData,
          installment,
          calculatedAmount,
        );
        voucherResult.status = StatusEnum.success;
      } else {
        voucherResult.status = StatusEnum.error;
        voucherResult.message =
          'Creating intersolve voucher failed. Status code: ' +
          (voucherInfo.resultCode ? voucherInfo.resultCode : 'unknown') +
          ' message: ' +
          (voucherInfo.resultDescription
            ? voucherInfo.resultDescription
            : 'unknown');
      }
      voucherInfoArray.push(voucherInfo);
      transactionResult.paTransactionResultList.push(voucherResult);
    }

    // If at least one voucher failed ..
    if (
      !voucherInfoArray.every(
        voucherInfo => voucherInfo.resultCode == IntersolveResultCode.Ok,
      )
    ) {
      // .. cancel all vouchers for phonenumber
      await this.cancelAllVouchersOnPhoneNumber(
        voucherInfoArray,
        transactionResult,
      );
      // .. and return early
      return transactionResult;
    }

    // If no whatsapp: return early
    if (!useWhatsapp) {
      transactionResult.status = StatusEnum.success;
      return transactionResult;
    }

    // Continue with whatsapp:
    return await this.sendWhatsapp(
      paymentInfo,
      voucherInfoArray,
      transactionResult,
      amount,
    );
  }

  private getIntersolveRefPos(): number {
    return parseInt(crypto.randomBytes(5).toString('hex'), 16);
  }

  private async issueVoucher(
    amount: number,
    intersolveRefPos: number,
  ): Promise<IntersolveIssueCardResponse> {
    const amountInCents = amount * 100;
    return await this.intersolveApiService.issueCard(
      amountInCents,
      intersolveRefPos,
    );
  }

  private async storeVoucher(
    voucherInfo: IntersolveIssueCardResponse,
    paPaymentData: PaPaymentDataDto,
    installment: number,
    amount: number,
  ): Promise<IntersolveBarcodeEntity> {
    const barcodeData = await this.storeBarcodeData(
      voucherInfo.cardId,
      voucherInfo.pin,
      paPaymentData.paymentAddress,
      installment,
      amount,
    );

    await this.imageCodeService.createBarcodeExportVouchers(
      barcodeData,
      paPaymentData.referenceId,
    );

    return barcodeData;
  }

  private async cancelAllVouchersOnPhoneNumber(
    voucherInfoArray: IntersolveIssueCardResponse[],
    transactionResult: PaymentAddressTransactionResultDto,
  ): Promise<void> {
    // .. cancel all created vouchers
    voucherInfoArray.forEach(async voucherInfo => {
      await this.cancelVoucher(voucherInfo);
    });
    // .. and also update all previously succeeded vouchers to failed
    transactionResult.paTransactionResultList.forEach(voucherResult => {
      if (voucherResult.status === StatusEnum.success) {
        voucherResult.status = StatusEnum.error;
        voucherResult.message =
          'Voucher was issued successfully, but was subsequently canceled because other voucher(s) for this same payment address failed';
      }
    });
    // .. and return early
    transactionResult.status = StatusEnum.error;
  }

  private async cancelVoucher(
    voucherInfo: IntersolveIssueCardResponse,
  ): Promise<void> {
    if (voucherInfo.transactionId) {
      await this.intersolveApiService.cancel(
        voucherInfo.cardId,
        voucherInfo.transactionId,
      );
    } else {
      await this.intersolveApiService.cancelTransactionByRefPos(
        voucherInfo.refPos,
      );
    }
  }

  private async sendWhatsapp(
    paymentInfo: PaPaymentDataAggregateDto,
    voucherInfoArray: IntersolveIssueCardResponse[],
    transactionResult: PaymentAddressTransactionResultDto,
    amount: number,
  ): Promise<PaymentAddressTransactionResultDto> {
    const transferResult = await this.sendVoucherWhatsapp(
      paymentInfo,
      voucherInfoArray,
      amount,
    );

    if (transferResult.status !== StatusEnum.error) {
      transactionResult = await this.processSucceededWhatsappResult(
        transactionResult,
        transferResult,
      );
    } else {
      transactionResult = await this.processFailedWhatsappResult(
        transactionResult,
        transferResult,
        voucherInfoArray,
      );
    }
    return transactionResult;
  }

  public async sendVoucherWhatsapp(
    paymentInfo: PaPaymentDataAggregateDto,
    voucherInfoArray: IntersolveIssueCardResponse[],
    amount: number,
  ): Promise<PaymentAddressTransactionResultDto> {
    const result = new PaymentAddressTransactionResultDto();
    result.paymentAddress = paymentInfo.paymentAddress;

    // Get language of one (first) PA, as you need one language
    const language = await this.getLanguage(
      paymentInfo.paPaymentDataList[0].referenceId,
    );
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    let whatsappPayment =
      voucherInfoArray.length > 1
        ? program.notifications[language]['whatsappPaymentMultiple'] ||
          program.notifications[language]['whatsappPayment']
        : program.notifications[language]['whatsappPayment'];
    // It is technically incorrect to take the multiplier of the 1st PA of potentially multiple with the same paymentAddress
    // .. but we have to choose something
    // .. and in practice it will never happen that there are multiple PAs with differing multipliers
    // .. and the old solution will soon be removed again from code
    const calculatedAmount = this.getMultipliedAmount(
      amount,
      paymentInfo.paPaymentDataList[0].paymentAmountMultiplier,
    );
    whatsappPayment = whatsappPayment.split('{{1}}').join(calculatedAmount);

    // NOTE: Assumes 1st of theoretically multiple PA's on same phone-number
    const registration = await this.registrationRepository.findOne({
      select: ['id'],
      where: { referenceId: paymentInfo.paPaymentDataList[0].referenceId },
    });
    await this.whatsappService
      .sendWhatsapp(whatsappPayment, paymentInfo.paymentAddress, null)
      .then(
        async response => {
          const messageSid = response;
          await this.insertTransactionIntersolve(
            voucherInfoArray[0].voucher.installment,
            voucherInfoArray[0].voucher.amount,
            registration.id,
            1,
            StatusEnum.waiting,
            null,
            messageSid,
          );

          result.status = StatusEnum.waiting;
          result.customData = {
            messageSid: messageSid,
            IntersolvePayoutStatus: IntersolvePayoutStatus.InitialMessage,
          };
        },
        error => {
          result.message = error;
          result.status = StatusEnum.error;
        },
      );
    return result;
  }

  private async getLanguage(referenceId: string): Promise<string> {
    // Also if multiple PA's get the language of one (the first) PA, as you have to choose one..
    return (
      (
        await this.registrationRepository.findOne({
          where: { referenceId: referenceId, preferredLanguage: Not(IsNull()) },
        })
      )?.preferredLanguage || 'en'
    );
  }

  private async processSucceededWhatsappResult(
    transactionResult: PaymentAddressTransactionResultDto,
    transferResult: PaymentAddressTransactionResultDto,
  ): Promise<PaymentAddressTransactionResultDto> {
    transactionResult.status = transferResult.status;
    transactionResult.customData = transferResult.customData;
    transactionResult.paTransactionResultList.forEach(pa => {
      pa.status = transferResult.status;
      pa.customData = transactionResult.customData;
    });
    return transactionResult;
  }

  private async processFailedWhatsappResult(
    transactionResult: PaymentAddressTransactionResultDto,
    transferResult: PaymentAddressTransactionResultDto,
    voucherInfoArray: IntersolveIssueCardResponse[],
  ): Promise<PaymentAddressTransactionResultDto> {
    transactionResult.status = StatusEnum.error;
    transactionResult.message =
      'Voucher(s) created, but something went wrong in sending voucher.\n' +
      transferResult.message;

    // If sending failed, replace pa-level (issue) status also to failed
    transactionResult.paTransactionResultList.forEach(pa => {
      pa.status = StatusEnum.error;
      pa.message = transactionResult.message;
    });
    // .. and cancel and delete vouchers again
    voucherInfoArray.forEach(async voucher => {
      await this.cancelAndDeleteVoucher(voucher.cardId, voucher.transactionId);
    });
    return transactionResult;
  }

  private async storeBarcodeData(
    cardNumber: string,
    pin: string,
    phoneNumber: string,
    installment: number,
    amount: number,
  ): Promise<IntersolveBarcodeEntity> {
    const barcodeData = new IntersolveBarcodeEntity();
    barcodeData.barcode = cardNumber;
    barcodeData.pin = pin.toString();
    barcodeData.whatsappPhoneNumber = phoneNumber;
    barcodeData.send = false;
    barcodeData.installment = installment;
    barcodeData.amount = amount;
    return this.intersolveBarcodeRepository.save(barcodeData);
  }

  public async processStatus(
    statusCallbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    const transaction = (
      await this.transactionRepository.find({ relations: ['registration'] })
    ).filter(
      t => t.customData['messageSid'] === statusCallbackData.MessageSid,
    )[0];
    if (!transaction) {
      // If no transaction found, it cannot (and should not have to) be updated
      return;
    }

    const succesStatuses = ['delivered', 'read'];
    const failStatuses = ['undelivered', 'failed'];
    let status: string;
    if (succesStatuses.includes(statusCallbackData.MessageStatus)) {
      status = StatusEnum.success;
    } else if (failStatuses.includes(statusCallbackData.MessageStatus)) {
      const registration = await this.registrationRepository.findOne({
        where: { id: transaction.registration.id },
        relations: ['images', 'images.barcode'],
      });
      // NOTE: array.find yields 1st element, but this is line with 1 voucher per installment
      const voucher = registration.images.find(
        i => i.barcode.installment === transaction.installment,
      ).barcode;
      const intersolveRequest = await this.intersolveRequestRepository.findOne({
        where: { cardId: voucher.barcode },
      });

      this.cancelAndDeleteVoucher(
        voucher.barcode,
        String(intersolveRequest.transactionId),
      );
      status = StatusEnum.error;
    } else {
      // For other statuses, no update needed
      return;
    }

    await this.transactionRepository.update(
      { id: transaction.id },
      {
        status: status,
        errorMessage:
          status === StatusEnum.error
            ? (statusCallbackData.ErrorMessage || '') +
              ' (ErrorCode: ' +
              statusCallbackData.ErrorCode +
              ')'
            : null,
      },
    );
  }

  public async exportVouchers(
    referenceId: string,
    installment: number,
  ): Promise<any> {
    const voucher = await this.getVoucher(referenceId, installment);

    return voucher.image;
  }

  private async getVoucher(
    referenceId: string,
    installment: number,
  ): Promise<any> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['images', 'images.barcode'],
    });
    if (!registration) {
      throw new HttpException(
        'PA with this referenceId not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const voucher = registration.images.find(
      image => image.barcode.installment === installment,
    );
    if (!voucher) {
      throw new HttpException(
        'Voucher not found. Maybe this installment was not (yet) made to this PA.',
        HttpStatus.NOT_FOUND,
      );
    }
    return voucher;
  }

  public async getInstruction(): Promise<any> {
    const intersolveInstructionsEntity = await this.intersolveInstructionsRepository.findOne();

    if (!intersolveInstructionsEntity) {
      throw new HttpException(
        'Image not found. Please upload an image using POST and try again.',
        HttpStatus.NOT_FOUND,
      );
    }

    return intersolveInstructionsEntity.image;
  }

  public async postInstruction(instructionsFileBlob): Promise<any> {
    let intersolveInstructionsEntity = await this.intersolveInstructionsRepository.findOne();

    if (!intersolveInstructionsEntity) {
      intersolveInstructionsEntity = new IntersolveInstructionsEntity();
    }

    intersolveInstructionsEntity.image = instructionsFileBlob.buffer;

    this.intersolveInstructionsRepository.save(intersolveInstructionsEntity);
  }

  public async cancelAndDeleteVoucher(
    cardId: string,
    transactionId: string,
  ): Promise<void> {
    await this.intersolveApiService.cancel(cardId, transactionId);
    const barcodeEntity = await this.intersolveBarcodeRepository.findOne({
      where: { barcode: cardId },
      relations: ['image'],
    });
    for (const image of barcodeEntity.image) {
      await this.imageCodeService.removeImageExportVoucher(image);
    }
    await this.intersolveBarcodeRepository.remove(barcodeEntity);
  }

  public async getVoucherBalance(
    referenceId: string,
    installment: number,
  ): Promise<number> {
    const voucher = await this.getVoucher(referenceId, installment);
    return await this.getBalance(voucher.barcode);
  }

  private async getBalance(
    intersolveBarcode: IntersolveBarcodeEntity,
  ): Promise<number> {
    const getCard = await this.intersolveApiService.getCard(
      intersolveBarcode.barcode,
      intersolveBarcode.pin,
    );
    const realBalance = getCard.balance / getCard.balanceFactor;
    return realBalance;
  }

  public async getUnusedVouchers(): Promise<UnusedVoucherDto[]> {
    const previouslyUnusedVouchers = await this.intersolveBarcodeRepository.find(
      {
        where: { balanceUsed: false },
        relations: ['image', 'image.registration'],
      },
    );
    const unusedVouchers = [];

    for await (const voucher of previouslyUnusedVouchers) {
      const balance = await this.getBalance(voucher);

      if (balance === voucher.amount) {
        let unusedVoucher = new UnusedVoucherDto();
        unusedVoucher.installment = voucher.installment;
        unusedVoucher.issueDate = voucher.timestamp;
        unusedVoucher.whatsappPhoneNumber = voucher.whatsappPhoneNumber;
        unusedVoucher.phoneNumber = voucher.image[0].registration.phoneNumber;
        unusedVoucher.customData = voucher.image[0].registration.customData;

        unusedVouchers.push(unusedVoucher);
      } else {
        voucher.balanceUsed = true;
        this.intersolveBarcodeRepository.save(voucher);
      }
    }

    return unusedVouchers;
  }

  public async insertTransactionIntersolve(
    installment: number,
    amount: number,
    registrationId: number,
    transactionStep: number,
    status: StatusEnum,
    errorMessage: string,
    messageSid?: string,
  ): Promise<void> {
    const transaction = new TransactionEntity();
    transaction.status = status;
    transaction.installment = installment;
    transaction.amount = amount;
    transaction.created = new Date();
    transaction.errorMessage = errorMessage;
    transaction.transactionStep = transactionStep;
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId },
      relations: ['fsp', 'program'],
    });
    transaction.registration = registration;
    const programId = registration.program.id;
    transaction.program = await this.programRepository.findOne(programId);
    transaction.financialServiceProvider = registration.fsp;

    transaction.customData = JSON.parse(JSON.stringify({}));
    if (messageSid) {
      transaction.customData['messageSid'] = messageSid;
    }
    if (registration.fsp.fsp === fspName.intersolve) {
      transaction.customData['IntersolvePayoutStatus'] =
        transactionStep === 1
          ? IntersolvePayoutStatus.InitialMessage
          : IntersolvePayoutStatus.VoucherSent;
    }
    await this.transactionRepository.save(transaction);
  }
}
