import { IntersolvePayoutStatus } from './api/enum/intersolve-payout-status.enum';
import { IntersolveIssueCardResponse } from './api/dto/intersolve-issue-card-response.dto';
import { WhatsappService } from './../../notifications/whatsapp/whatsapp.service';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { IntersolveApiService } from './api/instersolve.api.service';
import { StatusEnum } from '../../shared/enum/status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, Not, IsNull } from 'typeorm';
import { IntersolveBarcodeEntity } from './intersolve-barcode.entity';
import { ProgramEntity } from '../program/program.entity';
import { IntersolveResultCode } from './api/enum/intersolve-result-code.enum';
import crypto from 'crypto';
import { ConnectionEntity } from '../../connection/connection.entity';
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

@Injectable()
export class IntersolveService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;
  @InjectRepository(IntersolveInstructionsEntity)
  private readonly intersolveInstructionsRepository: Repository<
    IntersolveInstructionsEntity
  >;
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;

  private readonly programId = 1;

  public constructor(
    private readonly intersolveApiService: IntersolveApiService,
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
    );

    for (let paymentInfo of paPaymentDataAggregate) {
      const paymentAddressLevelResult = await this.sendPaymentsPerPhoneNumber(
        paymentInfo,
        useWhatsapp,
        amount,
        installment,
      );
      // Assign phoneNumber level transaction results back to each PA
      paymentAddressLevelResult.paTransactionResultList.forEach(paResult => {
        result.paList.push(paResult);
      });
    }
    result.fspName = paPaymentList[0].fspName;
    return result;
  }

  private aggregatePaPaymentListToPhoneNumber(
    paPaymentList: PaPaymentDataDto[],
  ): PaPaymentDataAggregateDto[] {
    const groupsByPaymentAddress: PaPaymentDataAggregateDto[] = [];
    paPaymentList.forEach(paPaymentData => {
      if (
        groupsByPaymentAddress
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
      const calculatedAmount =
        amount * (paPaymentData.paymentAmountMultiplier || 1);
      voucherResult.calculatedAmount = calculatedAmount;
      const voucherInfo = await this.issueVoucher(
        calculatedAmount,
        intersolveRefPos,
      );
      voucherInfo.refPos = intersolveRefPos;
      voucherInfoArray.push(voucherInfo);

      if (voucherInfo.resultCode == IntersolveResultCode.Ok) {
        await this.storeVoucher(
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
      transactionResult.paTransactionResultList.push(voucherResult);
    }

    // If at least one voucher vailed ..
    if (
      !voucherInfoArray.every(
        voucherInfo => voucherInfo.resultCode == IntersolveResultCode.Ok,
      )
    ) {
      // Cancel all vouchers
      await this.cancelAllVouchersOnPhoneNumber(
        voucherInfoArray,
        transactionResult,
      );
      // and return early
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
  ): Promise<void> {
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
  ): Promise<PaymentAddressTransactionResultDto> {
    const transferResult = await this.sendVoucherWhatsapp(
      paymentInfo,
      voucherInfoArray.length > 1, // boolean which determines single/multiple vouchers
    );

    if (transferResult.status === StatusEnum.success) {
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
    multiplePeople: boolean,
  ): Promise<PaymentAddressTransactionResultDto> {
    const result = new PaymentAddressTransactionResultDto();
    result.paymentAddress = paymentInfo.paymentAddress;

    // Get language of one (first) PA, as you need one language
    const language = await this.getLanguage(
      paymentInfo.paPaymentDataList[0].referenceId,
    );
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    try {
      const whatsappPayment = multiplePeople
        ? program.notifications[language]['whatsappPaymentMultiple'] ||
          program.notifications[language]['whatsappPayment']
        : program.notifications[language]['whatsappPayment'];
      await this.whatsappService.sendWhatsapp(
        whatsappPayment,
        paymentInfo.paymentAddress,
        null,
      );
      result.status = StatusEnum.success;
      result.customData = {
        IntersolvePayoutStatus: IntersolvePayoutStatus.InitialMessage,
      };
    } catch (e) {
      result.message = (e as Error).message;
      result.status = StatusEnum.error;
    }
    return result;
  }

  private async getLanguage(referenceId: string): Promise<string> {
    // Also if multiple PA's get the language of one (the first) PA, as you have to choose one..
    return (
      (
        await this.connectionRepository.findOne({
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
    const connection = await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['images', 'images.barcode'],
    });
    if (!connection) {
      throw new HttpException(
        'PA with this referenceId not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const voucher = connection.images.find(
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
        relations: ['image', 'image.connection'],
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
        unusedVoucher.phoneNumber = voucher.image[0].connection.phoneNumber;
        unusedVoucher.customData = voucher.image[0].connection.customData;

        unusedVouchers.push(unusedVoucher);
      } else {
        voucher.balanceUsed = true;
        this.intersolveBarcodeRepository.save(voucher);
      }
    }

    return unusedVouchers;
  }
}
