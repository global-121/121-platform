/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageCodeEntity } from './image-code.entity';
import { Repository } from 'typeorm';
import { EXTERNAL_API } from '../../config';
import crypto from 'crypto';
import { ImageCodeExportVouchersEntity } from './image-code-export-vouchers.entity';
import { IntersolveBarcodeEntity } from 'src/fsp/intersolve-barcode.entity';
import Jimp from 'jimp';
import { RegistrationEntity } from '../../registration/registration.entity';

@Injectable()
export class ImageCodeService {
  @InjectRepository(ImageCodeEntity)
  private readonly imageRepository: Repository<ImageCodeEntity>;
  @InjectRepository(ImageCodeExportVouchersEntity)
  private readonly imageExportVouchersRepository: Repository<
    ImageCodeExportVouchersEntity
  >;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor() {}

  public async createVoucherUrl(
    barcodeData: IntersolveBarcodeEntity,
  ): Promise<string> {
    let barcode = new ImageCodeEntity();
    barcode.secret = crypto.randomBytes(100).toString('hex');
    barcode.image = await this.generateVoucherImage({
      dateTime: barcodeData.timestamp,
      amount: barcodeData.amount,
      code: barcodeData.barcode,
      pin: barcodeData.pin,
    });
    await this.imageRepository.save(barcode);

    return EXTERNAL_API.imageCodeUrl + barcode.secret;
  }

  public async createBarcodeExportVouchers(
    barcodeData: IntersolveBarcodeEntity,
    referenceId: string,
  ): Promise<ImageCodeExportVouchersEntity> {
    let barcode = new ImageCodeExportVouchersEntity();

    barcode.registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
    });
    barcode.image = await this.generateVoucherImage({
      dateTime: barcodeData.timestamp,
      amount: barcodeData.amount,
      code: barcodeData.barcode,
      pin: barcodeData.pin,
    });
    barcode.barcode = barcodeData;

    return this.imageExportVouchersRepository.save(barcode);
  }

  public async removeImageExportVoucher(
    image: ImageCodeExportVouchersEntity,
  ): Promise<void> {
    await this.imageExportVouchersRepository.remove(image);
  }

  private async generateBarCode(code: string): Promise<Buffer> {
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
    const imageCode = await this.imageRepository.findOne({ secret: secret });
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

  public async generateVoucherImage(voucherData: {
    dateTime: Date;
    amount: number | string;
    code: string;
    pin: string;
  }): Promise<Buffer> {
    const voucherBaseFile = './seed-data/voucher/ah-voucher_base.png';
    const barcodeImage = await this.generateBarCode(voucherData.code);

    // See Jimp documentation: https://www.npmjs.com/package/jimp/v/0.16.1
    const voucher = await Jimp.read(voucherBaseFile).then(async image => {
      // Add the generated barcode
      await Jimp.read(barcodeImage).then(async barcode => {
        image.composite(barcode, 120, 652);
      });

      await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then(font => {
        image.print(font, 640, 79, this.formatDate(voucherData.dateTime)); // Date+time in the top-right corner
        image.print(font, 108, 614, `${voucherData.amount} Albert Heijn`); // Below "Dit ticket is geldig voor", after "€"
        image.print(font, 640, 604, `Euro ${voucherData.amount}.00`); // Below "Prijs:"
        image.print(font, 640, 730, voucherData.pin); // Below "Pincode:"
        image.print(font, 225, 800, voucherData.code); // Barcode numbers
      });

      // Add a 'scaled' amount to the title of the voucher
      const titleAmount = new Jimp(50, 50);
      await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
        titleAmount.print(font, 0, 0, voucherData.amount);
      });
      titleAmount.scale(0.7);
      image.composite(titleAmount, 583, 138);

      return image;
    });

    return await voucher.getBufferAsync(Jimp.MIME_PNG);
  }
}
