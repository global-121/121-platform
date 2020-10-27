import { WhatsappService } from './../../notifications/whatsapp/whatsapp.service';
import { StatusMessageDto } from './../../shared/dto/status-message.dto';
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class IntersolveService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
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
    payload,
    whatsapp: boolean,
  ): Promise<StatusMessageDto> {
    try {
      for (let paymentInfo of payload) {
        await this.sendIndividualPayment(paymentInfo, whatsapp);
      }
      return { status: StatusEnum.success, message: ' ' };
    } catch (e) {
      console.log('e: ', e);
      return { status: StatusEnum.error, message: ' ' };
    }
  }

  public async sendIndividualPayment(
    paymentInfo,
    whatsapp: boolean,
  ): Promise<any> {
    const intersolveRefPos = parseInt(
      crypto.randomBytes(5).toString('hex'),
      16,
    );

    const amountInCents = paymentInfo.amount * 100;
    const voucherInfo = await this.intersolveApiService.issueCard(
      amountInCents,
      intersolveRefPos,
    );
    if (voucherInfo.resultCode == IntersolveResultCode.Ok) {
      if (whatsapp) {
        await this.sendVoucherWhatsapp(
          voucherInfo.cardId,
          voucherInfo.pin,
          paymentInfo.whatsappPhoneNumber,
          paymentInfo.did,
        );
      } else {
        await this.storeVoucherNoWhatsapp(
          voucherInfo.cardId,
          voucherInfo.pin,
          paymentInfo.whatsappPhoneNumber,
          paymentInfo.did,
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
          voucherInfo.cardId,
          intersolveRefPos,
        );
      }
    }
  }

  public async sendVoucherWhatsapp(
    cardNumber: string,
    pin: number,
    phoneNumber: string,
    did: string,
  ): Promise<any> {
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    const whatsappPayment =
      program.notifications[this.language]['whatsappPayment'];
    this.whatsappService.sendWhatsapp(whatsappPayment, phoneNumber, null);

    const barcodeData = await this.storeBarcodeData(
      cardNumber,
      pin,
      phoneNumber,
    );

    // Also store in 2nd table in case of whatsApp (for exporting voucher in case of lost phone)
    await this.imageCodeService.createBarcodeExportVouchers(barcodeData, did);
  }

  public async storeVoucherNoWhatsapp(
    cardNumber: string,
    pin: number,
    phoneNumber: string,
    did: string,
  ): Promise<any> {
    const barcodeData = await this.storeBarcodeData(
      cardNumber,
      pin,
      phoneNumber,
    );

    await this.imageCodeService.createBarcodeExportVouchers(barcodeData, did);
  }

  private async storeBarcodeData(
    cardNumber: string,
    pin: number,
    phoneNumber: string,
  ): Promise<IntersolveBarcodeEntity> {
    const barcodeData = new IntersolveBarcodeEntity();
    barcodeData.barcode = cardNumber;
    barcodeData.pin = pin.toString();
    barcodeData.whatsappPhoneNumber = phoneNumber;
    barcodeData.send = false;
    return this.intersolveBarcodeRepository.save(barcodeData);
  }

  public async exportVouchers(did: string): Promise<any> {
    const connection = await this.connectionRepository.findOne({
      where: { did: did },
      relations: ['images', 'images.barcode'],
    });
    const images = connection.images.map(image => {
      return {
        timestamp: image.barcode.timestamp,
        image: image.image,
      };
    });
    return images;
  }
}
