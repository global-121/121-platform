import { ConnectionEntity } from './../../sovrin/create-connection/connection.entity';
import { IntersolvePayoutStatus } from './../../programs/fsp/api/enum/intersolve-payout-status.enum';
import { EXTERNAL_API } from '../../config';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository } from 'typeorm';
import { TwilioMessageEntity, NotificationType } from '../twilio.entity';
import { twilioClient } from '../twilio.client';
import { ProgramEntity } from '../../programs/program/program.entity';
import { ImageCodeService } from '../imagecode/image-code.service';
import { IntersolveBarcodeEntity } from '../../programs/fsp/intersolve-barcode.entity';
import { TransactionEntity } from '../../programs/program/transactions.entity';
import { StatusEnum } from '../../shared/enum/status.enum';

@Injectable()
export class WhatsappService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;

  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  private readonly programId = 1;

  public constructor(private readonly imageCodeService: ImageCodeService) {}

  public async notifyByWhatsapp(
    recipientPhoneNr: string,
    language: string,
    key: string,
    programId: number,
  ): Promise<void> {
    if (recipientPhoneNr) {
      const whatsappText = await this.getWhatsappText(language, key, programId);
      await this.sendWhatsapp(whatsappText, recipientPhoneNr, null);
    }
  }

  public async sendWhatsapp(
    message: string,
    recipientPhoneNr: string,
    mediaUrl: null | string,
  ): Promise<void> {
    if (mediaUrl) {
      twilioClient.messages
        .create({
          body: message,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
          from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
          statusCallback: EXTERNAL_API.callbackUrlWhatsapp,
          to: 'whatsapp:' + recipientPhoneNr,
          mediaUrl: mediaUrl,
        })
        .then(message => {
          this.storeSendWhatsapp(message);
        })
        .catch(err => console.log('Error twillio', err));
    } else {
      const result = await twilioClient.messages.create({
        body: message,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
        from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
        statusCallback: EXTERNAL_API.callbackUrlWhatsapp,
        to: 'whatsapp:' + recipientPhoneNr,
      });
      await this.storeSendWhatsapp(result);
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

  public async handleIncoming(callbackData): Promise<void> {
    const fromNumber = callbackData.From.replace('whatsapp:+', '');
    let connections = (
      await this.connectionRepository.find({
        relations: ['images', 'images.barcode'],
      })
    ).filter(c => c.customData['whatsappPhoneNumber'] === fromNumber);

    let language = 'en';
    try {
      language = connections[0].preferredLanguage;
    } catch (Error) {
      console.log(
        'Incomming whatsapp from non registered user phone last numbers: ',
        fromNumber.substr(-5),
      );
    }

    // Trim connections down to only those with outstanding vouchers
    connections.forEach(connection => {
      connection.images = connection.images.filter(
        image => !image.barcode.send,
      );
    });
    connections = connections.filter(
      connection => connection.images.length > 0,
    );

    // If no connections with outstanding barcodes: send auto-reply
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    if (!connections.length) {
      const whatsappReply = program.notifications[language]['whatsappReply'];
      await this.sendWhatsapp(whatsappReply, fromNumber, null);
    }

    // Start loop over (potentially) multiple PA's
    let instructionsSent = false;
    let defaultReplySent = false;
    let firstVoucherSent = false;
    const intersolveBarcodes = await this.intersolveBarcodeRepository.find({
      where: { whatsappPhoneNumber: fromNumber, send: false },
      relations: ['image', 'image.connection'],
    });
    for await (let connection of connections) {
      const intersolveBarcodesPerPa = intersolveBarcodes.filter(
        barcode => barcode.image[0].connection.did === connection.did,
      );

      // If no barcodes found: send auto-reply (but only once!)
      if (!intersolveBarcodesPerPa && !defaultReplySent) {
        const whatsappReply = program.notifications[language]['whatsappReply'];
        await this.sendWhatsapp(whatsappReply, fromNumber, null);
        defaultReplySent = true;
      }

      // Loop over last and old barcodes per PA
      for await (let intersolveBarcode of intersolveBarcodesPerPa) {
        const mediaUrl = await this.imageCodeService.createVoucherUrl(
          intersolveBarcode,
        );

        // Only include message with first voucher (across PA's and installments)
        // Send different message if multiple PA's on phone-number
        const message = firstVoucherSent
          ? ''
          : connections.length > 1
          ? program.notifications[language]['whatsappVoucherMultiple']
          : program.notifications[language]['whatsappVoucher'];
        await this.sendWhatsapp(
          message,
          intersolveBarcode.whatsappPhoneNumber,
          mediaUrl,
        );
        firstVoucherSent = true;

        // Send instruction message (but only once!)
        if (!instructionsSent) {
          await this.sendWhatsapp(
            '',
            intersolveBarcode.whatsappPhoneNumber,
            EXTERNAL_API.voucherInstructionsUrl,
          );
          instructionsSent = true;
        }

        // Save results
        intersolveBarcode.send = true;
        await this.intersolveBarcodeRepository.save(intersolveBarcode);
        await this.insertTransactionIntersolve(
          intersolveBarcode,
          connection.id,
        );
      }
    }
  }

  public async insertTransactionIntersolve(
    intersolveBarcode: IntersolveBarcodeEntity,
    connectionId: number,
  ): Promise<void> {
    const transaction = new TransactionEntity();
    transaction.status = StatusEnum.success;
    transaction.installment = intersolveBarcode.installment;
    transaction.amount = intersolveBarcode.amount;
    transaction.created = new Date();
    transaction.customData = JSON.parse(
      JSON.stringify({
        IntersolvePayoutStatus: IntersolvePayoutStatus.VoucherSent,
      }),
    );
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['fsp'],
    });
    transaction.connection = connection;
    const programId = connection.programsApplied[0];
    transaction.program = await this.programRepository.findOne(programId);
    transaction.financialServiceProvider = connection.fsp;
    await this.transactionRepository.save(transaction);
  }
}
