import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Equal, Repository } from 'typeorm';

import {
  ExtendedMessageProccessType,
  MessageJobCustomDataDto,
  MessageJobDto,
  MessageProcessType,
  MessageProcessTypeExtension,
} from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import {
  DEFAULT_QUEUE_CREATE_MESSAGE,
  MESSAGE_QUEUE_MAP,
  MessageQueueMap,
} from '@121-service/src/notifications/message-queue-mapping.const';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageSenderUserId } from '@121-service/src/notifications/types/message-sender-user-id.type';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

@Injectable()
export class MessageQueuesService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;
  private readonly queueNameToQueueMap: Partial<Record<QueueNames, Queue>>;

  public constructor(
    private readonly programRegistrationAttributesService: ProgramRegistrationAttributesService,
    private readonly queuesService: QueuesRegistryService,
  ) {
    this.queueNameToQueueMap = {
      [QueueNames.createMessageReplyOnIncoming]:
        this.queuesService.createMessageReplyOnIncomingQueue,
      [QueueNames.createMessageSmallBulk]:
        this.queuesService.createMessageSmallBulkQueue,
      [QueueNames.createMessageMediumBulk]:
        this.queuesService.createMessageMediumBulkQueue,
      [QueueNames.createMessageLargeBulk]:
        this.queuesService.createMessageLargeBulkQueue,
      [QueueNames.createMessageLowPriority]:
        this.queuesService.createMessageLowPriorityQueue,
    };
  }

  public async addMessageJob({
    registrationId,
    referenceId,
    programId,
    preferredLanguage,
    phoneNumber,
    whatsappPhoneNumber,
    extendedMessageProcessType,
    message,
    contentSid,
    messageTemplateKey,
    messageContentType,
    mediaUrl,
    customData,
    userId,
    bulkSize,
  }: {
    registrationId: number;
    referenceId: string;
    programId: number;
    preferredLanguage?: RegistrationPreferredLanguage | null;
    phoneNumber?: string;
    whatsappPhoneNumber?: string;
    extendedMessageProcessType: ExtendedMessageProccessType;
    message?: string;
    contentSid?: string;
    messageTemplateKey?: string;
    messageContentType: MessageContentType;
    mediaUrl?: string;
    customData?: MessageJobCustomDataDto;
    userId: MessageSenderUserId;
    bulkSize?: number;
  }): Promise<void> {
    // If messageProcessType is smsOrWhatsappTemplateGeneric, check if registration has whatsappPhoneNumber
    const messageProcessType: MessageProcessType =
      extendedMessageProcessType ===
      MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric
        ? whatsappPhoneNumber
          ? MessageProcessType.whatsappTemplateGeneric
          : MessageProcessType.sms
        : extendedMessageProcessType;

    try {
      const queueName = this.getQueueName(messageProcessType, bulkSize);
      const messageJob: MessageJobDto = {
        messageProcessType,
        registrationId,
        referenceId,
        preferredLanguage:
          preferredLanguage ?? RegistrationPreferredLanguage.en,
        whatsappPhoneNumber,
        phoneNumber,
        programId,
        message,
        contentSid,
        messageTemplateKey,
        messageContentType,
        mediaUrl,
        customData,
        userId,
      };
      const queue = this.queueNameToQueueMap[queueName]!;
      await queue.add(ProcessNameMessage.send, messageJob);
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
          type: Equal(messageTemplateKey),
          programId: Equal(programId),
          language: Equal(RegistrationPreferredLanguage.en), // use English to determine which placeholders are used
        },
      });
      if (!messageTemplate?.message) {
        throw new Error(
          `Message template with key ${messageTemplateKey} not found or has no message`,
        );
      }
      messageText = messageTemplate.message;
    }
    const placeholders =
      await this.programRegistrationAttributesService.getAttributes({
        programId,
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: true,
      });
    const usedPlaceholders: string[] = [];
    for (const placeholder of placeholders) {
      const regex = new RegExp(`{{${placeholder.name}}}`, 'g');
      if (messageText?.match(regex)) {
        usedPlaceholders.push(placeholder.name);
      }
    }
    return usedPlaceholders;
  }

  private getQueueName(
    messageProccessType: MessageProcessType,
    bulkSize?: number,
  ) {
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

    throw new Error(
      `No queueName found for message type: ${messageProccessType} and bulk size: ${bulkSize}`,
    );
  }
}
