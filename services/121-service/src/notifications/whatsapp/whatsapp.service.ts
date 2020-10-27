import { EXTERNAL_API } from '../../config';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository } from 'typeorm';
import { TwilioMessageEntity, NotificationType } from '../twilio.entity';
import { twilioClient } from '../twilio.client';
import { ProgramEntity } from '../../programs/program/program.entity';
import { ImageCodeService } from '../imagecode/image-code.service';
import { IntersolveBarcodeEntity } from '../../programs/fsp/intersolve-barcode.entity';

@Injectable()
export class WhatsappService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;

  private readonly programId = 1;
  private readonly language = 'en';

  public constructor(private readonly imageCodeService: ImageCodeService) {}

  public async notifyByWhatsapp(
    recipientPhoneNr: string,
    language: string,
    key: string,
    programId: number,
  ): Promise<void> {
    if (recipientPhoneNr) {
      const whatsappText = await this.getWhatsappText(language, key, programId);
      await this.sendWhatsapp(whatsappText, recipientPhoneNr, 'mybarcode');
    }
  }

  public async sendWhatsapp(
    message: string,
    recipientPhoneNr: string,
    barcodeString: string,
  ): Promise<void> {
    let mediaUrl = '';
    if (barcodeString) {
      mediaUrl = await this.imageCodeService.createBarcode(barcodeString);
      twilioClient.messages
        .create({
          body: message,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
          from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
          statusCallback: EXTERNAL_API.callbackUrlWhatsapp,
          to: 'whatsapp:' + recipientPhoneNr,
          mediaUrl: mediaUrl,
        })
        .then(message => this.storeSendWhatsapp(message))
        .catch(err => console.log('Error twillio', err));
    } else {
      twilioClient.messages
        .create({
          body: message,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
          from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
          statusCallback: EXTERNAL_API.callbackUrlWhatsapp,
          to: 'whatsapp:' + recipientPhoneNr,
        })
        .then(message => this.storeSendWhatsapp(message))
        .catch(err => console.log('Error twillio', err));
    }
  }

  public async getWhatsappText(
    language: string,
    key: string,
    programId: number,
  ): Promise<string> {
    const program = await getRepository(ProgramEntity).findOne(programId);
    return program.notifications[language][key];
  }

  public storeSendWhatsapp(message): void {
    console.log('message: ', message);
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = message.accountSid;
    twilioMessage.body = message.body;
    twilioMessage.to = message.to;
    twilioMessage.from = message.messagingServiceSid;
    twilioMessage.sid = message.sid;
    twilioMessage.status = message.status;
    twilioMessage.type = NotificationType.Whatsapp;
    twilioMessage.dateCreated = message.dateCreated;
    this.twilioMessageRepository.save(twilioMessage);
  }

  public async findOne(sid: string): Promise<TwilioMessageEntity> {
    const findOneOptions = {
      sid: sid,
    };
    return await this.twilioMessageRepository.findOne(findOneOptions);
  }

  public async statusCallback(callbackData): Promise<void> {
    await this.twilioMessageRepository.update(
      { sid: callbackData.MessageSid },
      { status: callbackData.MessageStatus },
    );
  }

  public async handleIncomming(callbackData): Promise<void> {
    const fromNumber = callbackData.From.replace('whatsapp:+', '');

    const program = await getRepository(ProgramEntity).findOne(this.programId);
    const intersolveBarcode = await this.intersolveBarcodeRepository.findOne({
      where: { phonenumber: fromNumber, send: false },
    });
    if (intersolveBarcode) {
      await this.sendWhatsapp(
        program.notifications[this.language]['whatsappVoucher'],
        intersolveBarcode.whatsappPhoneNumber,
        intersolveBarcode.barcode,
      );
      intersolveBarcode.send = true;
      await this.intersolveBarcodeRepository.save(intersolveBarcode);
    } else {
      const whatsappReply =
        program.notifications[this.language]['whatsappReply'];
      await this.sendWhatsapp(whatsappReply, fromNumber, null);
    }
  }
}
