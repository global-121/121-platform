import { SANS_16_BLACK } from '@jimp/plugin-print/fonts';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bwipjs from 'bwip-js';
import { Jimp, JimpMime, loadFont } from 'jimp';
import crypto from 'node:crypto';
import { Equal, LessThan, Repository } from 'typeorm';

import { EXTERNAL_API } from '@121-service/src/config';
import { IntersolveVoucherEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/entities/intersolve-voucher.entity';
import { ImageCodeEntity } from '@121-service/src/payments/imagecode/entities/image-code.entity';
import { ImageCodeExportVouchersEntity } from '@121-service/src/payments/imagecode/entities/image-code-export-vouchers.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

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
      amount: voucherData.transferValue,
      code: voucherData.barcode,
      pin: voucherData.pin,
    });
    await this.imageRepository.save(imageCodeEntity);

    return EXTERNAL_API.imageCodeUrl + imageCodeEntity.secret;
  }

  public async createVoucherExportVouchers({
    intersolveVoucherEntity,
    referenceId,
  }: {
    intersolveVoucherEntity: IntersolveVoucherEntity;
    referenceId: string;
  }): Promise<ImageCodeExportVouchersEntity> {
    const imageCodeExportVouchersEntity = new ImageCodeExportVouchersEntity();

    imageCodeExportVouchersEntity.registration =
      await this.registrationRepository.findOneOrFail({
        where: { referenceId: Equal(referenceId) },
      });
    imageCodeExportVouchersEntity.voucher = intersolveVoucherEntity;

    return this.imageExportVouchersRepository.save(
      imageCodeExportVouchersEntity,
    );
  }

  public async removeImageCodesCreatedBefore({
    date,
  }: {
    date: Date;
  }): Promise<number> {
    const deleteResult = await this.imageRepository.delete({
      created: LessThan(date),
    });
    return deleteResult?.affected ?? 0;
  }

  private async generateBarCodeImage(code: string): Promise<Buffer> {
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

  public async get(secret: string): Promise<unknown> {
    const imageCode = await this.imageRepository.findOneBy({
      secret,
    });
    // Removes the image from the database after getting it
    if (imageCode) {
      return imageCode.image;
    } else {
      throw new HttpException(
        'Twilio is not able to retrieve voucher',
        HttpStatus.NOT_FOUND,
      );
    }
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
    amount: number | string | null;
    code: string;
    pin: string;
  }): Promise<Buffer> {
    const voucherBaseFile = './src/seed-data/voucher/ah-voucher_base.png';
    const barcodeImage = await this.generateBarCodeImage(voucherData.code);

    // See Jimp migration guide: https://jimp-dev.github.io/jimp/guides/migrate-to-v1/
    const voucher = await Jimp.read(voucherBaseFile);

    // Add the generated barcode
    const barcode = await Jimp.read(barcodeImage);
    voucher.composite(barcode, 120, 652);

    const font = await loadFont(SANS_16_BLACK);
    voucher.print({
      font,
      x: 640,
      y: 79,
      text: this.formatDate(voucherData.dateTime),
    }); // Date+time in the top-right corner
    voucher.print({
      font,
      x: 108,
      y: 614,
      text: `${this.formatDecimals(String(voucherData.amount), false)} Albert Heijn`,
    }); // Below "Dit ticket is geldig voor", after "€"
    voucher.print({
      font,
      x: 640,
      y: 604,
      text: `Euro ${this.formatDecimals(String(voucherData.amount), true)}`,
    }); // Below "Prijs:"
    voucher.print({
      font,
      x: 640,
      y: 730,
      text: voucherData.pin,
    }); // Below "Pincode:"
    voucher.print({
      font,
      x: 225,
      y: 800,
      text: voucherData.code,
    }); // Barcode numbers

    return await voucher.getBuffer(JimpMime.png);
  }
}
