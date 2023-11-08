import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../registration/registration.entity';
import { MessageContentType } from './enum/message-type.enum';
import { SmsService } from './sms/sms.service';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { MessageTemplateEntity } from './message-template/message-template.entity';

@Injectable()
export class MessageService {
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(
    private readonly whatsappService: WhatsappService,
    private readonly smsService: SmsService,
    private readonly dataSource: DataSource,
  ) {}

  public async sendTextMessage(
    registration: RegistrationEntity,
    programId: number,
    message?: string,
    key?: string,
    tryWhatsApp = false,
    messageContentType?: MessageContentType,
  ): Promise<void> {
    if (!message && !key) {
      throw new HttpException(
        'A message or a key should be supplied.',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const whatsappNumber = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.whatsappPhoneNumber,
      );

      const messageText = message
        ? message
        : await this.getNotificationText(
            registration.preferredLanguage,
            key,
            programId,
          );
      if (whatsappNumber) {
        await this.whatsappService
          .queueMessageSendTemplate(
            messageText,
            whatsappNumber,
            null,
            null,
            registration.id,
            messageContentType,
          )
          .catch((error) => {
            console.warn('Error in queueMessageSendTemplate: ', error);
          });
      } else if (tryWhatsApp && registration.phoneNumber) {
        await this.tryWhatsapp(registration, messageText, messageContentType);
      } else if (registration.phoneNumber) {
        await this.smsService.sendSms(
          messageText,
          registration.phoneNumber,
          registration.id,
          messageContentType,
        );
      } else {
        throw new HttpException(
          'A recipientPhoneNr should be supplied.',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  public async getNotificationText(
    language: string,
    key: string,
    programId: number,
  ): Promise<string> {
    const messageTemplates = await this.dataSource
      .getRepository(MessageTemplateEntity)
      .findBy({
        program: { id: programId },
        type: key,
      });

    const notification = messageTemplates.find(
      (template) => template.language === language,
    );
    if (notification) {
      return notification.message;
    }

    const fallbackNotification = messageTemplates.find(
      (template) => template.language === this.fallbackLanguage,
    );
    if (fallbackNotification) {
      return fallbackNotification.message;
    }

    return '';
  }

  private async tryWhatsapp(
    registration: RegistrationEntity,
    messageText,
    messageContentType?: MessageContentType,
  ): Promise<void> {
    const result = await this.whatsappService.queueMessageSendTemplate(
      messageText,
      registration.phoneNumber,
      null,
      null,
      registration.id,
      messageContentType,
    );
    const tryWhatsapp = {
      sid: result,
      registration,
    };
    await this.tryWhatsappRepository.save(tryWhatsapp);
  }
}
