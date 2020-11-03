/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageCodeEntity } from './image-code.entity';
import { Repository } from 'typeorm';
import { EXTERNAL_API } from '../../config';
import crypto from 'crypto';
import { ImageCodeExportVouchersEntity } from './image-code-export-vouchers.entity';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { IntersolveBarcodeEntity } from 'src/programs/fsp/intersolve-barcode.entity';
import Jimp from 'jimp';

@Injectable()
export class ImageCodeService {
  @InjectRepository(ImageCodeEntity)
  private readonly imageRepository: Repository<ImageCodeEntity>;
  @InjectRepository(ImageCodeExportVouchersEntity)
  private readonly imageExportVouchersRepository: Repository<
    ImageCodeExportVouchersEntity
  >;
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;

  public constructor() {}

  public async createVoucherUrl(
    barcodeData: IntersolveBarcodeEntity,
  ): Promise<string> {
    let barcode = new ImageCodeEntity();
    barcode.secret = crypto.randomBytes(100).toString('hex');
    barcode.image = await this.generateVoucherImage({
      dateTime: barcodeData.timestamp,
      amount: 35,
      code: barcodeData.barcode,
      pin: barcodeData.pin,
    });
    this.imageRepository.save(barcode);

    return EXTERNAL_API.imageCodeUrl + barcode.secret;
  }

  public async createBarcodeExportVouchers(
    barcodeData: IntersolveBarcodeEntity,
    did: string,
  ): Promise<ImageCodeExportVouchersEntity> {
    let barcode = new ImageCodeExportVouchersEntity();

    barcode.connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    barcode.image = await this.generateVoucherImage({
      dateTime: barcodeData.timestamp,
      amount: 35,
      code: barcodeData.barcode,
      pin: barcodeData.pin,
    });
    barcode.barcode = barcodeData;

    return this.imageExportVouchersRepository.save(barcode);
  }

  private async generateBarCode(code: string): Promise<Buffer> {
    const bwipjs = require('bwip-js');
    return await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 1,
      height: 18,
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
      '',
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

    return `${date.getDate()} ${
      monthNames[date.getMonth()]
    } ${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
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
        image.composite(barcode, 100, 440);
      });

      await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK).then(font => {
        image.print(font, 392, 87, voucherData.amount); // End of "title"
      });

      await Jimp.loadFont(Jimp.FONT_SANS_12_BLACK).then(font => {
        image.print(font, 431, 46, this.formatDate(voucherData.dateTime)); // Date+time in the top-right corner
        image.print(font, 72, 408, `${voucherData.amount} Albert Heijn`); // Below "Dit ticket is geldig voor", after "€"
        image.print(font, 431, 400, `Euro ${voucherData.amount}.00`); // Below "Prijs:"
        image.print(font, 431, 487, voucherData.pin); // Below "Pincode:"
        image.print(font, 150, 534, voucherData.code); // Barcode numbers
      });

      return image;
    });

    return await voucher.getBufferAsync(Jimp.MIME_PNG);
  }
}
