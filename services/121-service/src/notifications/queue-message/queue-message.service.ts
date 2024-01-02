import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { ProgramAttributesService } from '../../program-attributes/program-attributes.service';
import { CustomDataAttributes } from '../../registration/enum/custom-data-attributes';
import { RegistrationViewEntity } from '../../registration/registration-view.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import {
  DEFAULT_QUEUE_CREATE_MESSAGE,
  MessageQueueMap,
  MESSAGE_QUEUE_MAP,
} from '../enum/message-queue-mapping.const';
import { MessageContentType } from '../enum/message-type.enum';
import { ProcessName, QueueNameCreateMessage } from '../enum/queue.names.enum';
import {
  ExtendedMessageProccessType,
  MessageJobCustomDataDto,
  MessageJobDto,
  MessageProcessType,
  MessageProcessTypeExtension,
} from '../message-job.dto';
import { MessageTemplateEntity } from '../message-template/message-template.entity';

@Injectable()
export class QueueMessageService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;

  public constructor(
    private readonly programAttributesService: ProgramAttributesService,
    @InjectQueue(QueueNameCreateMessage.replyOnIncoming)
    private readonly messageProcessorReplyOnIncoming: Queue,
    @InjectQueue(QueueNameCreateMessage.smallBulk)
    private readonly messageProcessorSmallBulk: Queue,
    @InjectQueue(QueueNameCreateMessage.mediumBulk)
    private readonly messageProcessorMediumBulk: Queue,
    @InjectQueue(QueueNameCreateMessage.largeBulk)
    private readonly messageProcessorLargeBulk: Queue,
    @InjectQueue(QueueNameCreateMessage.lowPriority)
    private readonly messageProcessorLowPriority: Queue,
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
        await this.messageProcessorReplyOnIncoming.add(
          ProcessName.send,
          messageJob,
        );
      } else if (queueName === QueueNameCreateMessage.smallBulk) {
        await this.messageProcessorSmallBulk.add(ProcessName.send, messageJob);
      } else if (queueName === QueueNameCreateMessage.mediumBulk) {
        await this.messageProcessorMediumBulk.add(ProcessName.send, messageJob);
      } else if (queueName === QueueNameCreateMessage.largeBulk) {
        await this.messageProcessorLargeBulk.add(ProcessName.send, messageJob);
      } else if (queueName === QueueNameCreateMessage.lowPriority) {
        await this.messageProcessorLowPriority.add(
          ProcessName.send,
          messageJob,
        );
      }
    } catch (error) {
      console.warn('Error in addMessageToQueue: ', error);
    }
  }

  public async getPlaceholdersInMessageText(
    programId: number,
    messageText?: string,
    messageTemplateKey?: string,
  ): Promise<string[]> {
    if (!messageText && !messageTemplateKey) {
      return [];
    }
    if (messageTemplateKey) {
      const messageTemplate = await this.messageTemplateRepository.findOne({
        where: {
          type: messageTemplateKey,
          programId: programId,
          language: 'en', // use english to determine which placeholders are used
        },
      });
      messageText = messageTemplate.message;
    }
    const placeholders = await this.programAttributesService.getAttributes(
      programId,
      true,
      true,
      false,
      true,
    );
    const usedPlaceholders = [];
    for (const placeholder of placeholders) {
      const regex = new RegExp(`{{${placeholder.name}}}`, 'g');
      if (messageText.match(regex)) {
        usedPlaceholders.push(placeholder.name);
      }
    }
    return usedPlaceholders;
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
      return DEFAULT_QUEUE_CREATE_MESSAGE; // default priority
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
