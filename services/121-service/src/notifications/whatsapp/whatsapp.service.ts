import { RegistrationEntity } from './../../registration/registration.entity';
import { EXTERNAL_API } from '../../config';
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, In } from 'typeorm';
import { TwilioMessageEntity, NotificationType } from '../twilio.entity';
import { twilioClient } from '../twilio.client';
import { ProgramEntity } from '../../programs/program/program.entity';
import { ImageCodeService } from '../imagecode/image-code.service';
import { IntersolveBarcodeEntity } from '../../programs/fsp/intersolve-barcode.entity';
import { StatusEnum } from '../../shared/enum/status.enum';
import { FspService } from '../../programs/fsp/fsp.service';
import { fspName } from '../../programs/fsp/financial-service-provider.entity';
import { IntersolveService } from '../../programs/fsp/intersolve.service';
import { CustomDataAttributes } from '../../connection/validation-data/dto/custom-data-attributes';
import {
  TwilioStatusCallbackDto,
  TwilioIncomingCallbackDto,
} from '../twilio.dto';

@Injectable()
export class WhatsappService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  private readonly programId = 1;
  private readonly fallbackLanguage = 'en';

  public constructor(
    private readonly imageCodeService: ImageCodeService,
    @Inject(forwardRef(() => IntersolveService))
    private readonly intersolveService: IntersolveService,
    @Inject(forwardRef(() => FspService))
    private readonly fspService: FspService,
  ) {}

  public async notifyByWhatsapp(
    recipientPhoneNr: string,
    language: string,
    programId: number,
    message?: string,
    key?: string,
  ): Promise<void> {
    if (!recipientPhoneNr) {
      throw new HttpException(
        'A recipientPhoneNr should be supplied.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!message && !key) {
      throw new HttpException(
        'A message or a key should be supplied.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const whatsappText =
      message || (await this.getWhatsappText(language, key, programId));
    await this.sendWhatsapp(whatsappText, recipientPhoneNr, null);
  }

  public async sendWhatsapp(
    message: string,
    recipientPhoneNr: string,
    mediaUrl: null | string,
  ): Promise<any> {
    const payload = {
      body: message,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      statusCallback: EXTERNAL_API.whatsAppStatus,
      to: 'whatsapp:' + recipientPhoneNr,
    };
    if (mediaUrl) {
      payload['mediaUrl'] = mediaUrl;
    }
    return twilioClient.messages
      .create(payload)
      .then(message => {
        this.storeSendWhatsapp(message);
        return message.sid;
      })
      .catch(err => {
        console.log('Error from Twilio:', err);
        throw err;
      });
  }

  public async getWhatsappText(
    language: string,
    key: string,
    programId: number,
  ): Promise<string> {
    const program = await getRepository(ProgramEntity).findOne(programId);
    const fallbackNotifications = program.notifications[this.fallbackLanguage];
    let notifications = fallbackNotifications;

    if (program.notifications[language]) {
      notifications = program.notifications[language];
    }
    if (notifications[key]) {
      return notifications[key];
    }
    return fallbackNotifications[key] ? fallbackNotifications[key] : '';
  }

  public storeSendWhatsapp(message): void {
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

  public async statusCallback(
    callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    await this.twilioMessageRepository.update(
      { sid: callbackData.MessageSid },
      { status: callbackData.MessageStatus },
    );

    const statuses = ['delivered', 'read', 'failed', 'undelivered'];
    if (statuses.includes(callbackData.MessageStatus)) {
      await this.fspService.processPaymentStatus(
        fspName.intersolve,
        callbackData,
      );
    }
  }

  private async getRegistrationsWithPhoneNumber(
    phoneNumber,
  ): Promise<RegistrationEntity[]> {
    const regisrationsWithPhoneNumber = (
      await this.registrationRepository.find({
        select: ['id', 'customData'],
      })
    ).filter(
      r =>
        r.customData[CustomDataAttributes.whatsappPhoneNumber] === phoneNumber,
    );

    if (!regisrationsWithPhoneNumber.length) {
      console.log(
        'Incoming WhatsApp-message from non-registered phone-number: ',
        phoneNumber.substr(-5).padStart(phoneNumber.length, '*'),
      );
    }
    return regisrationsWithPhoneNumber;
  }

  private async getRegistrationsWithOpenVouchers(
    registrations: RegistrationEntity[],
  ): Promise<RegistrationEntity[]> {
    // Trim connections down to only those with outstanding vouchers
    const registrationIds = registrations.map(c => c.id);
    const registrationWithVouchers = await this.registrationRepository.find({
      where: { id: In(registrationIds) },
      relations: ['images', 'images.barcode'],
    });
    return registrationWithVouchers
      .map(registration => {
        registration.images = registration.images.filter(
          image => !image.barcode.send,
        );
        return registration;
      })
      .filter(registration => registration.images.length > 0);
  }

  private cleanWhatsAppNr(value: string): string {
    return value.replace('whatsapp:+', '');
  }

  public async handleIncoming(
    callbackData: TwilioIncomingCallbackDto,
  ): Promise<void> {
    if (!callbackData.From) {
      throw new HttpException(
        `No "From" address specified.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const fromNumber = this.cleanWhatsAppNr(callbackData.From);
    const connectionsWithPhoneNumber = await this.getRegistrationsWithPhoneNumber(
      fromNumber,
    );
    const registrationsWithOpenVouchers = await this.getRegistrationsWithOpenVouchers(
      connectionsWithPhoneNumber,
    );

    // If no connections with outstanding barcodes: send auto-reply
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    const language =
      registrationsWithOpenVouchers[0]?.preferredLanguage || 'en';
    if (registrationsWithOpenVouchers.length === 0) {
      const whatsappDefaultReply =
        program.notifications[language]['whatsappReply'];
      await this.sendWhatsapp(whatsappDefaultReply, fromNumber, null);
      return;
    }

    // Start loop over (potentially) multiple PA's
    let firstVoucherSent = false;
    for await (let registration of registrationsWithOpenVouchers) {
      const intersolveBarcodesPerPa = registration.images.map(
        image => image.barcode,
      );

      // Loop over current and (potentially) old barcodes per PA
      for await (let intersolveBarcode of intersolveBarcodesPerPa) {
        const mediaUrl = await this.imageCodeService.createVoucherUrl(
          intersolveBarcode,
        );

        // Only include text with first voucher (across PA's and installments)
        let message = firstVoucherSent
          ? ''
          : registrationsWithOpenVouchers.length > 1
          ? program.notifications[language]['whatsappVoucherMultiple'] ||
            program.notifications[language]['whatsappVoucher']
          : program.notifications[language]['whatsappVoucher'];
        message = message.split('{{1}}').join(intersolveBarcode.amount);
        await this.sendWhatsapp(message, fromNumber, mediaUrl);
        console.log('mediaUrl: ', mediaUrl);
        console.log('fromNumber: ', fromNumber);
        console.log('message: ', message);
        firstVoucherSent = true;

        // Save results
        intersolveBarcode.send = true;
        await this.intersolveBarcodeRepository.save(intersolveBarcode);
        await this.intersolveService.insertTransactionIntersolve(
          intersolveBarcode.installment,
          intersolveBarcode.amount,
          registration.id,
          2,
          StatusEnum.success,
          null,
        );

        // Add small delay/sleep to ensure the order in which messages are received
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    console.log(
      'registrationsWithOpenVouchers: ',
      registrationsWithOpenVouchers,
    );
    // Send instruction message only once (outside of loops)
    if (registrationsWithOpenVouchers.length > 0) {
      await this.sendWhatsapp(
        '',
        fromNumber,
        EXTERNAL_API.voucherInstructionsUrl,
      );
    }
  }
}
