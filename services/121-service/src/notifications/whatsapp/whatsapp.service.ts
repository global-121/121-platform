import { ConnectionEntity } from './../../connection/connection.entity';
import { IntersolvePayoutStatus } from './../../programs/fsp/api/enum/intersolve-payout-status.enum';
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
import { TransactionEntity } from '../../programs/program/transactions.entity';
import { StatusEnum } from '../../shared/enum/status.enum';
import { FspService } from '../../programs/fsp/fsp.service';
import { fspName } from '../../programs/fsp/financial-service-provider.entity';
import { CustomDataAttributes } from '../../connection/validation-data/dto/custom-data-attributes';

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

  public constructor(
    private readonly imageCodeService: ImageCodeService,
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
    if (recipientPhoneNr) {
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
      statusCallback: EXTERNAL_API.callbackUrlWhatsapp,
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
      .catch(err => console.log('Error twillio', err));
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
    // console.log('callbackData: ', callbackData);

    await this.fspService.processPaymentStatus(
      fspName.intersolve,
      callbackData,
    );

    await this.twilioMessageRepository.update(
      { sid: callbackData.MessageSid },
      { status: callbackData.MessageStatus },
    );
  }

  private async getConnectionsWithPhoneNumber(
    phoneNumber,
  ): Promise<ConnectionEntity[]> {
    const connectionsWithPhoneNumber = (
      await this.connectionRepository.find({
        select: ['id', 'customData'],
      })
    ).filter(
      c =>
        c.customData[CustomDataAttributes.whatsappPhoneNumber] === phoneNumber,
    );

    if (!connectionsWithPhoneNumber.length) {
      console.log(
        'Incoming whatsapp from non registered user phone last numbers: ',
        phoneNumber.substr(-5),
      );
    }
    return connectionsWithPhoneNumber;
  }

  private async getConnectionsWithOpenVouchers(
    connections: ConnectionEntity[],
  ): Promise<ConnectionEntity[]> {
    // Trim connections down to only those with outstanding vouchers
    const connectionIds = connections.map(c => c.id);
    const connectionsWithVouchers = await this.connectionRepository.find({
      where: { id: In(connectionIds) },
      relations: ['images', 'images.barcode'],
    });
    return connectionsWithVouchers
      .map(connection => {
        connection.images = connection.images.filter(
          image => !image.barcode.send,
        );
        return connection;
      })
      .filter(connection => connection.images.length > 0);
  }

  private cleanCallbackWhatsappNr(callbackData): string {
    return callbackData.From.replace('whatsapp:+', '');
  }

  public async handleIncoming(callbackData): Promise<void> {
    const fromNumber = this.cleanCallbackWhatsappNr(callbackData);
    const connectionsWithPhoneNumber = await this.getConnectionsWithPhoneNumber(
      fromNumber,
    );
    const connectionsWithOpenVouchers = await this.getConnectionsWithOpenVouchers(
      connectionsWithPhoneNumber,
    );

    // If no connections with outstanding barcodes: send auto-reply
    const program = await getRepository(ProgramEntity).findOne(this.programId);
    const language = connectionsWithOpenVouchers[0]?.preferredLanguage || 'en';
    if (connectionsWithOpenVouchers.length === 0) {
      const whatsappDefaultReply =
        program.notifications[language]['whatsappReply'];
      await this.sendWhatsapp(whatsappDefaultReply, fromNumber, null);
      return;
    }

    // Start loop over (potentially) multiple PA's
    let firstVoucherSent = false;
    for await (let connection of connectionsWithOpenVouchers) {
      const intersolveBarcodesPerPa = connection.images.map(
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
          : connectionsWithOpenVouchers.length > 1
          ? program.notifications[language]['whatsappVoucherMultiple'] ||
            program.notifications[language]['whatsappVoucher']
          : program.notifications[language]['whatsappVoucher'];
        message = message.split('{{1}}').join(intersolveBarcode.amount);
        await this.sendWhatsapp(
          message,
          intersolveBarcode.whatsappPhoneNumber,
          mediaUrl,
        );
        firstVoucherSent = true;

        // Save results
        intersolveBarcode.send = true;
        await this.intersolveBarcodeRepository.save(intersolveBarcode);
        await this.insertTransactionIntersolve(
          intersolveBarcode,
          connection.id,
          2,
          StatusEnum.success,
        );

        // Add small delay/sleep to ensure the order in which messages are received
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    // Send instruction message only once (outside of loops)
    if (connectionsWithOpenVouchers.length > 0) {
      await this.sendWhatsapp(
        '',
        fromNumber,
        EXTERNAL_API.voucherInstructionsUrl,
      );
    }
  }

  public async insertTransactionIntersolve(
    intersolveBarcode: IntersolveBarcodeEntity,
    connectionId: number,
    transactionStep: number,
    status: StatusEnum,
    messageSid?: string,
  ): Promise<void> {
    const transaction = new TransactionEntity();
    transaction.status = status;
    transaction.installment = intersolveBarcode.installment;
    transaction.amount = intersolveBarcode.amount;
    transaction.created = new Date();
    transaction.customData = JSON.parse(
      JSON.stringify({
        IntersolvePayoutStatus:
          transactionStep === 1
            ? IntersolvePayoutStatus.InitialMessage
            : IntersolvePayoutStatus.VoucherSent,
      }),
    );
    if (messageSid) {
      transaction.customData['messageSid'] = messageSid;
    }
    transaction.transactionStep = transactionStep;
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
