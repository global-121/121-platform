/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import Jimp from 'jimp';
import { Repository } from 'typeorm';
import { EXTERNAL_API } from '../../config';
import { RegistrationEntity } from '../../registration/registration.entity';
import { IntersolveVoucherEntity } from '../fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { ImageCodeExportVouchersEntity } from './image-code-export-vouchers.entity';
import { ImageCodeEntity } from './image-code.entity';

@Injectable()
export class ImageCodeService {
  @InjectRepository(ImageCodeEntity)
  private readonly imageRepository: Repository<ImageCodeEntity>;
  @InjectRepository(ImageCodeExportVouchersEntity)
  private readonly imageExportVouchersRepository: Repository<ImageCodeExportVouchersEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public async createVoucherUrl(
    voucherData: IntersolveVoucherEntity,
  ): Promise<string> {
    const imageCodeEntity = new ImageCodeEntity();
    imageCodeEntity.secret = crypto.randomBytes(100).toString('hex');
    imageCodeEntity.image = await this.generateVoucherImage({
      dateTime: voucherData.created,
      amount: voucherData.amount,
      code: voucherData.barcode,
      pin: voucherData.pin,
    });
    await this.imageRepository.save(imageCodeEntity);

    return EXTERNAL_API.imageCodeUrl + imageCodeEntity.secret;
  }

  public async createVoucherExportVouchers(
    intersolveVoucherEntity: IntersolveVoucherEntity,
    referenceId: string,
  ): Promise<ImageCodeExportVouchersEntity> {
    const imageCodeExportVouchersEntity = new ImageCodeExportVouchersEntity();

    imageCodeExportVouchersEntity.registration =
      await this.registrationRepository.findOne({
        where: { referenceId: referenceId },
      });
    imageCodeExportVouchersEntity.image = await this.generateVoucherImage({
      dateTime: intersolveVoucherEntity.created,
      amount: intersolveVoucherEntity.amount,
      code: intersolveVoucherEntity.barcode,
      pin: intersolveVoucherEntity.pin,
    });
    imageCodeExportVouchersEntity.voucher = intersolveVoucherEntity;

    return this.imageExportVouchersRepository.save(
      imageCodeExportVouchersEntity,
    );
  }

  public async removeImageExportVoucher(
    image: ImageCodeExportVouchersEntity,
  ): Promise<void> {
    await this.imageExportVouchersRepository.remove(image);
  }

  private async generateBarCodeImage(code: string): Promise<Buffer> {
    const bwipjs = require('bwip-js');
    return await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 2,
      height: 15,
      includetext: false,
      backgroundcolor: 'FFFFFF',
      padding: 10,
    });
  }

  public async get(secret: string): Promise<any> {
    const imageCode = await this.imageRepository.findOneBy({
      secret: secret,
    });
    // Removes the image from the database after getting it
    await this.imageRepository.remove(imageCode);
    return imageCode.image;
  }

  private formatDate(date: Date): string {
    const monthNames = [
      'januari',
      'februari',
      'maart',
      'april',
      'mei',
      'juni',
      'juli',
      'augustus',
      'september',
      'oktober',
      'november',
      'december',
    ];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const time = date.toTimeString().substring(0, 5);

    return `${day} ${month} ${date.getFullYear()} ${time}`;
  }

  private formatDecimals(amount: string, showZerosIfInteger: boolean): string {
    const amountFloat = parseFloat(amount);
    if (!Number.isInteger(amountFloat) || showZerosIfInteger) {
      return amountFloat.toFixed(2);
    }

    return amountFloat.toFixed(0);
  }

  public async generateVoucherImage(voucherData: {
    dateTime: Date;
    amount: number | string;
    code: string;
    pin: string;
  }): Promise<Buffer> {
    const voucherBaseFile = './seed-data/voucher/ah-voucher_base.png';
    const barcodeImage = await this.generateBarCodeImage(voucherData.code);

    // See Jimp documentation: https://www.npmjs.com/package/jimp/v/0.16.1
    const voucher = await Jimp.read(voucherBaseFile).then(async (image) => {
      // Add the generated barcode
      await Jimp.read(barcodeImage).then(async (barcode) => {
        image.composite(barcode, 120, 652);
      });

      await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then((font) => {
        image.print(font, 640, 79, this.formatDate(voucherData.dateTime)); // Date+time in the top-right corner
        image.print(
          font,
          108,
          614,
          `${this.formatDecimals(
            String(voucherData.amount),
            false,
          )} Albert Heijn`,
        ); // Below "Dit ticket is geldig voor", after "€"
        image.print(
          font,
          640,
          604,
          `Euro ${this.formatDecimals(String(voucherData.amount), true)}`,
        ); // Below "Prijs:"
        image.print(font, 640, 730, voucherData.pin); // Below "Pincode:"
        image.print(font, 225, 800, voucherData.code); // Barcode numbers
      });

      return image;
    });

    return await voucher.getBufferAsync(Jimp.MIME_PNG);
  }
}
