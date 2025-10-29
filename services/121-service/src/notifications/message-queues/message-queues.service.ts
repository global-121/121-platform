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
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { UILanguageEnum } from '@121-service/src/shared/enum/ui-language.enum';

@Injectable()
export class MessageQueuesService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;
  private readonly queueNameToQueueMap: Partial<Record<QueueNames, Queue>>;

  public constructor(
    private readonly registrationDataService: RegistrationDataService,
    private readonly programAttributesService: ProgramAttributesService,
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
    registration,
    message,
    contentSid,
    messageTemplateKey,
    messageContentType,
    messageProcessType,
    mediaUrl,
    customData,
    bulksize,
    userId,
  }: {
    registration: RegistrationEntity | Omit<RegistrationViewEntity, 'data'>;
    message?: string;
    contentSid?: string;
    messageTemplateKey?: string;
    messageContentType: MessageContentType;
    messageProcessType: ExtendedMessageProccessType;
    mediaUrl?: string | null;
    customData?: MessageJobCustomDataDto;
    bulksize?: number;
    userId: number;
  }): Promise<void> {
    let whatsappPhoneNumber =
      registration[DefaultRegistrationDataAttributeNames.whatsappPhoneNumber];
    if (registration instanceof RegistrationEntity) {
      whatsappPhoneNumber =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          DefaultRegistrationDataAttributeNames.whatsappPhoneNumber,
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

    try {
      const queueName = this.getQueueName(messageProcessType, bulksize);
      const messageJob: MessageJobDto = {
        messageProcessType,
        registrationId: registration.id,
        referenceId: registration.referenceId,
        preferredLanguage: registration.preferredLanguage ?? UILanguageEnum.en,
        whatsappPhoneNumber,
        phoneNumber: registration.phoneNumber ?? undefined,
        programId: registration.programId,
        message,
        contentSid,
        messageTemplateKey,
        messageContentType,
        mediaUrl: mediaUrl ?? undefined,
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
          language: Equal('en'), // use English to determine which placeholders are used
        },
      });
      if (!messageTemplate?.message) {
        throw new Error(
          `Message template with key ${messageTemplateKey} not found or has no message`,
        );
      }
      messageText = messageTemplate.message;
    }
    const placeholders = await this.programAttributesService.getAttributes({
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
