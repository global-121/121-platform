import { Injectable } from '@nestjs/common';
import { MessageContentType } from '../enum/message-type.enum';
import { MessageJobCustomDataDto, MessageJobDto } from '../message-job.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RegistrationEntity } from '../../registration/registration.entity';
import { CustomDataAttributes } from '../../registration/enum/custom-data-attributes';
import { RegistrationViewEntity } from '../../registration/registration-view.entity';
import { ProcessName } from '../enum/processor.names.enum';

@Injectable()
export class QueueMessageService {
  public constructor(
    @InjectQueue('message') private readonly messageQueue: Queue,
  ) {}

  public async addMessageToQueue(
    registration: RegistrationEntity | RegistrationViewEntity,
    message: string,
    key: string,
    tryWhatsApp: boolean,
    messageContentType?: MessageContentType,
    mediaUrl?: string,
    customData?: MessageJobCustomDataDto,
  ): Promise<void> {
    let whatsappPhoneNumber;
    if (registration instanceof RegistrationViewEntity) {
      whatsappPhoneNumber = registration['whatsappPhoneNumber'];
    } else if (registration instanceof RegistrationEntity) {
      whatsappPhoneNumber = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.whatsappPhoneNumber,
      );
    }
    const messageJob: MessageJobDto = {
      id: registration.id,
      referenceId: registration.referenceId,
      preferredLanguage: registration.preferredLanguage,
      whatsappPhoneNumber: whatsappPhoneNumber,
      phoneNumber: registration.phoneNumber,
      programId: registration.programId,
      message,
      key,
      tryWhatsApp,
      messageContentType,
      mediaUrl,
      customData,
    };
    try {
      await this.messageQueue.add(ProcessName.send, messageJob);
    } catch (error) {
      console.warn('Error in addMessageToQueue: ', error);
    }
  }
}
