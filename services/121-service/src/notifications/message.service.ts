import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { MessageContentType } from './enum/message-type.enum';
import { SmsService } from './sms/sms.service';
import { TryWhatsappEntity } from './whatsapp/try-whatsapp.entity';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { MessageJobDto } from './message-job.dto';

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

  public async sendTextMessage(messageJobDto: MessageJobDto): Promise<void> {
    if (!messageJobDto.message && !messageJobDto.key) {
      throw new HttpException(
        'A message or a key should be supplied.',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const whatsappNumber = messageJobDto.whatsappPhoneNumber;

      const messageText = messageJobDto.message
        ? messageJobDto.message
        : await this.getNotificationText(
            messageJobDto.preferredLanguage,
            messageJobDto.key,
            messageJobDto.programId,
          );
      if (whatsappNumber) {
        await this.whatsappService
          .queueMessageSendTemplate(
            messageText,
            whatsappNumber,
            null,
            null,
            messageJobDto.id,
            messageJobDto.messageContentType,
          )
          .catch((error) => {
            console.warn('Error in queueMessageSendTemplate: ', error);
          });
      } else if (messageJobDto.tryWhatsApp && messageJobDto.phoneNumber) {
        await this.tryWhatsapp(
          messageJobDto,
          messageText,
          messageJobDto.messageContentType,
        );
      } else if (messageJobDto.phoneNumber) {
        await this.smsService.sendSms(
          messageText,
          messageJobDto.phoneNumber,
          messageJobDto.id,
          messageJobDto.messageContentType,
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
    const program = await this.dataSource
      .getRepository(ProgramEntity)
      .findOneBy({
        id: programId,
      });
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

  private async tryWhatsapp(
    messageJobDto: MessageJobDto,
    messageText,
    messageContentType?: MessageContentType,
  ): Promise<void> {
    const result = await this.whatsappService.queueMessageSendTemplate(
      messageText,
      messageJobDto.phoneNumber,
      null,
      null,
      messageJobDto.id,
      messageContentType,
    );
    const tryWhatsapp = {
      sid: result,
      registrationId: messageJobDto.id,
    };
    await this.tryWhatsappRepository.save(tryWhatsapp);
  }
}
