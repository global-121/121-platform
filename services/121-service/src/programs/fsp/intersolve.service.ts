import { WhatsappService } from './../../notifications/whatsapp/whatsapp.service';
import { StatusMessageDto } from './../../shared/dto/status-message.dto';
import { Injectable } from '@nestjs/common';
import { IntersolveApiService } from './api/instersolve.api.service';
import { StatusEnum } from '../../shared/enum/status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository } from 'typeorm';
import { IntersolveBarcodeEntity } from './intersolve-barcode.entity';
import { ProgramEntity } from '../program/program.entity';

@Injectable()
export class IntersolveService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;

  private readonly programId = 1;
  private readonly language = 'en';

  public constructor(
    private readonly intersolveApiService: IntersolveApiService,
    private readonly whatsappService: WhatsappService,
  ) {}

  public async sendPayment(payload): Promise<StatusMessageDto> {
    console.log('payload: ', payload);
    try {
      for (let paymentInfo of payload) {
        await this.sendIndividualPayment(paymentInfo);
      }
      return { status: StatusEnum.success, message: ' ' };
    } catch (e) {
      console.log('e: ', e);
      return { status: StatusEnum.error, message: ' ' };
    }
  }

  public async sendIndividualPayment(paymentInfo): Promise<any> {
    const amountInCents = paymentInfo.amount * 100;
    const voucherInfo = await this.intersolveApiService.issueCard(
      amountInCents,
    );
    await this.sendVoucherWhatsapp(
      voucherInfo.cardId,
      voucherInfo.pin,
      paymentInfo.phoneNumber,
    );
  }

  public async sendVoucherWhatsapp(
    cardNumber: string,
    pin: number,
    phoneNumber: string,
  ): Promise<any> {
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    const whatsappPayment =
      program.notifications[this.language]['whatsappPayment'];

    this.whatsappService.sendWhatsapp(whatsappPayment, phoneNumber, null);
    const barcodeData = new IntersolveBarcodeEntity();
    barcodeData.barcode = cardNumber;
    barcodeData.pin = pin.toString();
    barcodeData.phonenumber = phoneNumber;
    barcodeData.send = false;
    this.intersolveBarcodeRepository.save(barcodeData);
  }
}
