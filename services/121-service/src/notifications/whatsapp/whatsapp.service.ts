import { WhatsappPendingMessageEntity } from './whatsapp-pending-message.entity';
import {
  Injectable,
  Inject,
  forwardRef,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, In } from 'typeorm';
import { EXTERNAL_API } from '../../config';
import { ProgramEntity } from '../../programs/program.entity';
import { TransactionEntity } from '../../payments/transactions/transaction.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { StatusEnum } from '../../shared/enum/status.enum';
import { ImageCodeService } from '../../payments/imagecode/image-code.service';
import { twilioClient } from '../twilio.client';
import {
  TwilioStatusCallbackDto,
  TwilioStatus,
  TwilioIncomingCallbackDto,
} from '../twilio.dto';
import { TwilioMessageEntity, NotificationType } from '../twilio.entity';
import { IntersolvePayoutStatus } from '../../payments/fsp-integration/intersolve/enum/intersolve-payout-status.enum';
import { IntersolveBarcodeEntity } from '../../payments/fsp-integration/intersolve/intersolve-barcode.entity';
import { IntersolveService } from '../../payments/fsp-integration/intersolve/intersolve.service';

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
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(WhatsappPendingMessageEntity)
  public pendingMessageRepo: Repository<WhatsappPendingMessageEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;

  private readonly programId = 1;
  private readonly fallbackLanguage = 'en';

  public constructor(
    private readonly imageCodeService: ImageCodeService,
    @Inject(forwardRef(() => IntersolveService))
    private readonly intersolveService: IntersolveService,
  ) {}

  public async sendWhatsapp(
    message: string,
    recipientPhoneNr: string,
    messageType: null | IntersolvePayoutStatus,
    mediaUrl: null | string,
    registrationId?: number,
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
    if (!!process.env.MOCK_TWILIO) {
      payload['messageType'] = messageType;
    }
    return twilioClient.messages
      .create(payload)
      .then(message => {
        this.storeSendWhatsapp(message, registrationId, mediaUrl);
        return message.sid;
      })
      .catch(err => {
        console.log('Error from Twilio:', err);
        throw err;
      });
  }

  public async queueMessageSendTemplate(
    message: string,
    recipientPhoneNr: string,
    messageType: null | IntersolvePayoutStatus,
    mediaUrl: null | string,
    registrationId?: number,
    preferedLanguage?: string,
  ): Promise<void> {
    const pendingMesssage = new WhatsappPendingMessageEntity();
    pendingMesssage.body = message;
    pendingMesssage.to = recipientPhoneNr;
    pendingMesssage.mediaUrl = mediaUrl;
    pendingMesssage.messageType = messageType;
    pendingMesssage.registrationId = registrationId;
    this.pendingMessageRepo.save(pendingMesssage);
    const language = preferedLanguage
      ? preferedLanguage
      : this.fallbackLanguage;
    const registration = await this.registrationRepository.findOne(
      registrationId,
      {
        relations: ['program'],
      },
    );
    const whatsappGenericMesage = this.getGenericNotificationText(
      language,
      registration.program,
    );
    this.sendWhatsapp(
      whatsappGenericMesage,
      recipientPhoneNr,
      messageType,
      mediaUrl,
      registrationId,
    );
  }

  public getGenericNotificationText(
    language: string,
    program: ProgramEntity,
  ): string {
    const key = 'whatsappGenericMesage';
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

  public storeSendWhatsapp(
    message,
    registrationId: number,
    mediaUrl: string,
  ): void {
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = message.accountSid;
    twilioMessage.body = message.body;
    twilioMessage.mediaUrl = mediaUrl;
    twilioMessage.to = message.to;
    twilioMessage.from = message.messagingServiceSid;
    twilioMessage.sid = message.sid;
    twilioMessage.status = message.status;
    twilioMessage.type = NotificationType.Whatsapp;
    twilioMessage.dateCreated = message.dateCreated;
    twilioMessage.registrationId = registrationId;
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

    const statuses = [
      TwilioStatus.delivered,
      TwilioStatus.read,
      TwilioStatus.failed,
      TwilioStatus.undelivered,
    ];
    if (statuses.includes(callbackData.MessageStatus)) {
      await this.intersolveService.processStatus(callbackData);
    }
  }

  private async getRegistrationsWithPhoneNumber(
    phoneNumber,
  ): Promise<RegistrationEntity[]> {
    const registrationsWithPhoneNumber = await getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .select('registration.id')
      .where('registration.customData ::jsonb @> :customData', {
        customData: {
          whatsappPhoneNumber: phoneNumber,
        },
      })
      .leftJoinAndSelect(
        'registration.whatsappPendingMessages',
        'whatsappPendingMessages',
      )
      .orderBy('whatsappPendingMessages.created', 'ASC')
      .getMany();

    if (!registrationsWithPhoneNumber.length) {
      console.log(
        'Incoming WhatsApp-message from non-registered phone-number: ',
        phoneNumber.substr(-5).padStart(phoneNumber.length, '*'),
      );
    }
    return registrationsWithPhoneNumber;
  }

  private async getRegistrationsWithOpenVouchers(
    registrations: RegistrationEntity[],
  ): Promise<RegistrationEntity[]> {
    // Trim registrations down to only those with outstanding vouchers
    const registrationIds = registrations.map(c => c.id);
    const registrationWithVouchers = await this.registrationRepository.find({
      where: { id: In(registrationIds) },
      relations: ['images', 'images.barcode'],
    });

    // Don't send more then 3 vouchers, so no vouchers of more than 2 payments ago
    const lastPayment = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MAX(transaction.payment)', 'max')
      .getRawOne();
    const minimumPayment = lastPayment ? lastPayment.max - 2 : 0;

    return registrationWithVouchers
      .map(registration => {
        registration.images = registration.images.filter(
          image =>
            !image.barcode.send && image.barcode.payment >= minimumPayment,
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

    // Get (potentially multiple) registrations on incoming phonenumber
    // NOTE: this is still possible, even though 'grouping on phonenumber' is removed again on 2021-10-12
    const registrationsWithPhoneNumber = await this.getRegistrationsWithPhoneNumber(
      fromNumber,
    );

    const registrationsWithPendingMessage = registrationsWithPhoneNumber.filter(
      (registration: RegistrationEntity) =>
        registration.whatsappPendingMessages,
    );

    const registrationsWithOpenVouchers = await this.getRegistrationsWithOpenVouchers(
      registrationsWithPhoneNumber,
    );

    // If no registrations with outstanding barcodes or messages: send auto-reply
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    const language =
      registrationsWithOpenVouchers[0]?.preferredLanguage || 'en';
    if (
      registrationsWithOpenVouchers.length === 0 &&
      registrationsWithPendingMessage.length === 0
    ) {
      const whatsappDefaultReply =
        program.notifications[language]['whatsappReply'];
      await this.sendWhatsapp(
        whatsappDefaultReply,
        fromNumber,
        null,
        null,
        null,
      );
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

        // Only include text with first voucher (across PA's and payments)
        let message = firstVoucherSent
          ? ''
          : registrationsWithOpenVouchers.length > 1
          ? program.notifications[language]['whatsappVoucherMultiple'] ||
            program.notifications[language]['whatsappVoucher']
          : program.notifications[language]['whatsappVoucher'];
        message = message.split('{{1}}').join(intersolveBarcode.amount);
        await this.sendWhatsapp(
          message,
          fromNumber,
          IntersolvePayoutStatus.VoucherSent,
          mediaUrl,
          registration.id,
        );
        firstVoucherSent = true;

        // Save results
        intersolveBarcode.send = true;
        await this.intersolveBarcodeRepository.save(intersolveBarcode);
        await this.intersolveService.storeTransactionResult(
          intersolveBarcode.payment,
          intersolveBarcode.amount,
          registration.id,
          2,
          StatusEnum.success,
          null,
        );

        // Add small delay/sleep to ensure the order in which messages are received
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Send instruction message only once (outside of loops)
      if (registrationsWithOpenVouchers.length > 0) {
        await this.sendWhatsapp(
          '',
          fromNumber,
          null,
          EXTERNAL_API.voucherInstructionsUrl,
          registration.id,
        );
      }
    }
    if (
      registrationsWithPendingMessage &&
      registrationsWithPendingMessage.length > 0
    ) {
      this.sendPendingWhatsappMessages(registrationsWithPendingMessage);
    }
  }
  private sendPendingWhatsappMessages(
    registrationsWithPendingMessage: RegistrationEntity[],
  ): void {
    for (const registration of registrationsWithPendingMessage) {
      if (registration.whatsappPendingMessages) {
        for (const message of registration.whatsappPendingMessages) {
          this.sendWhatsapp(
            message.body,
            message.to,
            message.messageType
              ? (message.messageType as IntersolvePayoutStatus)
              : null,
            message.mediaUrl,
            message.registrationId,
          ).then(() => {
            this.pendingMessageRepo.remove(message);
          });
        }
      }
    }
  }
}
