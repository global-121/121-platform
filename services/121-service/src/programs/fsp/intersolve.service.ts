import { IntersolvePayoutStatus } from './api/enum/intersolve-payout-status.enum';
import { IntersolveIssueCardResponse } from './api/dto/intersolve-issue-card-response.dto';
import { WhatsappService } from './../../notifications/whatsapp/whatsapp.service';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { IntersolveApiService } from './api/instersolve.api.service';
import { StatusEnum } from '../../shared/enum/status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository } from 'typeorm';
import { IntersolveBarcodeEntity } from './intersolve-barcode.entity';
import { ProgramEntity } from '../program/program.entity';
import { IntersolveResultCode } from './api/enum/intersolve-result-code.enum';
import crypto from 'crypto';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { ImageCodeService } from '../../notifications/imagecode/image-code.service';
import { IntersolveInstructionsEntity } from './intersolve-instructions.entity';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from './dto/payment-transaction-result.dto';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
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
  private readonly language = 'en';

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
    for (let paymentInfo of paPaymentList) {
      const isolatedResult = await this.sendIndividualPayment(
        paymentInfo,
        useWhatsapp,
        amount,
        installment,
      );
      result.paList.push(isolatedResult);
    }
    result.fspName = paPaymentList[0].fspName;
    return result;
  }

  public async sendIndividualPayment(
    paymentInfo: PaPaymentDataDto,
    useWhatsapp: boolean,
    amount: number,
    installment: number,
  ): Promise<PaTransactionResultDto> {
    const result = new PaTransactionResultDto();
    result.did = paymentInfo.did;

    const intersolveRefPos = parseInt(
      crypto.randomBytes(5).toString('hex'),
      16,
    );

    const amountInCents = amount * 100;
    const voucherInfo = await this.intersolveApiService.issueCard(
      amountInCents,
      intersolveRefPos,
    );
    if (voucherInfo.resultCode == IntersolveResultCode.Ok) {
      const transferResult = await this.transferVoucher(
        voucherInfo,
        paymentInfo,
        useWhatsapp,
        amount,
        installment,
      );
      if (transferResult.status === StatusEnum.success) {
        result.status = transferResult.status;
        result.message = transferResult.message;
        result.customData = transferResult.customData;
      } else {
        result.status = StatusEnum.error;
        result.message =
          'Voucher created, but something went wrong in sending voucher.\n' +
          transferResult.message;
        await this.cancelAndDeleteVoucher(
          voucherInfo.cardId,
          voucherInfo.transactionId,
        );
      }
    } else {
      if (voucherInfo.transactionId) {
        await this.intersolveApiService.cancel(
          voucherInfo.cardId,
          voucherInfo.transactionId,
        );
      } else {
        await this.intersolveApiService.cancelTransactionByRefPos(
          intersolveRefPos,
        );
      }
      result.message =
        'Creating intersolve voucher failed. Status code: ' +
        (voucherInfo.resultCode ? voucherInfo.resultCode : 'unknown') +
        ' message: ' +
        (voucherInfo.resultDescription
          ? voucherInfo.resultDescription
          : 'unknown');
      result.status = StatusEnum.error;
    }
    return result;
  }

  public async transferVoucher(
    voucherInfo: IntersolveIssueCardResponse,
    paymentInfo: PaPaymentDataDto,
    useWhatsapp: boolean,
    amount: number,
    installment: number,
  ): Promise<PaTransactionResultDto> {
    if (useWhatsapp) {
      return await this.sendVoucherWhatsapp(
        voucherInfo.cardId,
        voucherInfo.pin,
        paymentInfo.paymentAddress,
        paymentInfo.did,
        installment,
        amount,
      );
    } else {
      return await this.storeVoucherNoWhatsapp(
        voucherInfo.cardId,
        voucherInfo.pin,
        null,
        paymentInfo.did,
        installment,
        amount,
      );
    }
  }

  public async sendVoucherWhatsapp(
    cardNumber: string,
    pin: number,
    phoneNumber: string,
    did: string,
    installment: number,
    amount: number,
  ): Promise<PaTransactionResultDto> {
    const result = new PaTransactionResultDto();
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    const barcodeData = await this.storeBarcodeData(
      cardNumber,
      pin,
      phoneNumber,
      installment,
      amount,
    );

    // Also store in 2nd table in case of whatsApp (for exporting voucher in case of lost phone)
    await this.imageCodeService.createBarcodeExportVouchers(barcodeData, did);

    try {
      const whatsappPayment =
        program.notifications[this.language]['whatsappPayment'];
      await this.whatsappService.sendWhatsapp(
        whatsappPayment,
        phoneNumber,
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

  public async storeVoucherNoWhatsapp(
    cardNumber: string,
    pin: number,
    phoneNumber: string,
    did: string,
    installment: number,
    amount: number,
  ): Promise<PaTransactionResultDto> {
    const result = new PaTransactionResultDto();
    const barcodeData = await this.storeBarcodeData(
      cardNumber,
      pin,
      phoneNumber,
      installment,
      amount,
    );

    await this.imageCodeService.createBarcodeExportVouchers(barcodeData, did);
    result.status = StatusEnum.success;
    return result;
  }

  private async storeBarcodeData(
    cardNumber: string,
    pin: number,
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

  public async exportVouchers(did: string, installment: number): Promise<any> {
    const connection = await this.connectionRepository.findOne({
      where: { did: did },
      relations: ['images', 'images.barcode'],
    });
    if (!connection) {
      throw new HttpException(
        'PA with this DID not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const image = connection.images.find(
      image => image.barcode.installment === installment,
    );
    if (!image) {
      throw new HttpException(
        'Image not found. Maybe this installment was not (yet) made to this PA.',
        HttpStatus.NOT_FOUND,
      );
    }

    return image.image;
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
    transactionId: number,
  ): Promise<void> {
    await this.intersolveApiService.cancel(cardId, transactionId);
    const barcodeEntity = await this.intersolveBarcodeRepository.findOne({
      where: { barcode: cardId },
      relations: ['image'],
    });
    for (const image of barcodeEntity.image) {
      console.log('removing', image);
      await this.imageCodeService.removeImageExportVoucher(image);
    }
    await this.intersolveBarcodeRepository.remove(barcodeEntity);
  }

  public async getUnusedVouchers(): Promise<UnusedVoucherDto[]> {
    const vouchers = await this.intersolveBarcodeRepository.find();
    const unusedVouchers = [];

    for await (const v of vouchers) {
      const getCard = await this.intersolveApiService.getCard(v.barcode, v.pin);
      const realBalance = getCard.balance / getCard.balanceFactor;

      if (realBalance === v.amount) {
        let unusedVoucher = new UnusedVoucherDto();
        unusedVoucher.installment = v.installment;
        unusedVoucher.issueDate = v.timestamp;
        unusedVoucher.whatsappPhoneNumber = v.whatsappPhoneNumber;

        unusedVouchers.push(unusedVoucher);
      }
    }

    return unusedVouchers;
  }
}
