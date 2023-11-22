import { Injectable } from '@nestjs/common';
import { MessageContentType } from '../enum/message-type.enum';
import {
  ExtendedMessageProccessType,
  MessageJobCustomDataDto,
  MessageJobDto,
  MessageProcessType,
  MessageProcessTypeExtension,
} from '../message-job.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RegistrationEntity } from '../../registration/registration.entity';
import { CustomDataAttributes } from '../../registration/enum/custom-data-attributes';
import { RegistrationViewEntity } from '../../registration/registration-view.entity';
import { ProcessName, QueueNameCreateMessage } from '../enum/queue.names.enum';
import {
  DEFAULT_PRIORITY,
  MessageQueueMap,
  MESSAGE_QUEUE_MAP,
} from '../enum/message-queue-mapping.const';

@Injectable()
export class QueueMessageService {
  public constructor(
    @InjectQueue(QueueNameCreateMessage.replyOnIncoming)
    private readonly messageQueue100: Queue,
    @InjectQueue(QueueNameCreateMessage.smallBulk)
    private readonly messageQueue200: Queue,
    @InjectQueue(QueueNameCreateMessage.mediumBulk)
    private readonly messageQueue300: Queue,
    @InjectQueue(QueueNameCreateMessage.largeBulk)
    private readonly messageQueue400: Queue,
    @InjectQueue(QueueNameCreateMessage.voucherReminder)
    private readonly messageQueue500: Queue,
  ) {}

  public async addMessageToQueue(
    registration: RegistrationEntity | RegistrationViewEntity,
    message: string,
    key: string,
    messageContentType: MessageContentType,
    messageProcessType: ExtendedMessageProccessType,
    mediaUrl?: string,
    customData?: MessageJobCustomDataDto,
    bulksize?: number,
  ): Promise<void> {
    let whatsappPhoneNumber;
    if (registration instanceof RegistrationViewEntity) {
      whatsappPhoneNumber = registration['whatsappPhoneNumber'];
    } else if (registration instanceof RegistrationEntity) {
      whatsappPhoneNumber = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.whatsappPhoneNumber,
      );
    }

    // If messageProcessType is smsOrWhatsappTemplateGeneric, check if registration has whatsappPhoneNumber
    if (
      messageProcessType ===
      MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric
    ) {
      messageProcessType = whatsappPhoneNumber
        ? MessageProcessType.whatsappTemplateGeneric
        : MessageProcessType.sms;
    }

    const queueName = this.getQueueName(messageProcessType, bulksize);
    const messageJob: MessageJobDto = {
      messageProcessType: messageProcessType,
      registrationId: registration.id,
      referenceId: registration.referenceId,
      preferredLanguage: registration.preferredLanguage,
      whatsappPhoneNumber: whatsappPhoneNumber,
      phoneNumber: registration.phoneNumber,
      programId: registration.programId,
      message,
      key,
      messageContentType,
      mediaUrl,
      customData,
    };
    try {
      if (queueName === QueueNameCreateMessage.replyOnIncoming) {
        await this.messageQueue100.add(ProcessName.send, messageJob);
      } else if (queueName === QueueNameCreateMessage.smallBulk) {
        await this.messageQueue200.add(ProcessName.send, messageJob);
      } else if (queueName === QueueNameCreateMessage.mediumBulk) {
        await this.messageQueue300.add(ProcessName.send, messageJob);
      } else if (queueName === QueueNameCreateMessage.largeBulk) {
        await this.messageQueue400.add(ProcessName.send, messageJob);
      } else if (queueName === QueueNameCreateMessage.voucherReminder) {
        await this.messageQueue500.add(ProcessName.send, messageJob);
      }
    } catch (error) {
      console.warn('Error in addMessageToQueue: ', error);
    }
  }

  private getQueueName(
    messageProccessType: MessageProcessType,
    bulkSize?: number,
  ): QueueNameCreateMessage {
    const mappingArray = MESSAGE_QUEUE_MAP;

    const relevantMapping = mappingArray.find((map: MessageQueueMap) => {
      return map.types.includes(messageProccessType);
    });

    // No mapping is found use default priority
    if (!relevantMapping) {
      console.warn(
        'No priority mapping found for message type: ',
        messageProccessType,
      );
      return DEFAULT_PRIORITY; // default priority
    }

    // If no bulkSize is provided, use default priority of mapping
    if (bulkSize == null) {
      return relevantMapping.queueName;
    }

    // If bulkSize is provided, and bulkSizePriority is not set, use default priority of mapping and give warning
    if (!relevantMapping.bulkSizeQueueName) {
      console.warn(
        `No bulkSizePriority found for message type: ${messageProccessType} while bulk size is set to: ${bulkSize}. Using default priority of mapping.`,
      );
      return relevantMapping.queueName; // default priority of mapping
    }

    // If bulkSize is provided, and bulkSizePriority set on the mapping use the bulk size priority mapping
    const bulkSizePriorities = relevantMapping.bulkSizeQueueName;
    for (const bulkSizePriorityItem of bulkSizePriorities) {
      if (bulkSize < bulkSizePriorityItem.bulkSize) {
        return bulkSizePriorityItem.queueName;
      }
    }
  }
}
