import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Equal, Repository } from 'typeorm';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import {
  ExtendedMessageProccessType,
  MessageJobCustomDataDto,
  MessageJobDto,
  MessageProcessType,
  MessageProcessTypeExtension,
} from '@121-service/src/notifications/message-job.dto';
import {
  DEFAULT_QUEUE_CREATE_MESSAGE,
  MESSAGE_QUEUE_MAP,
  MessageQueueMap,
} from '@121-service/src/notifications/message-queue-mapping.const';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { CreateMessageQueueNames } from '@121-service/src/queues-registry/enum/create-message-queue-names.enum';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

@Injectable()
export class MessageQueuesService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;
  private readonly queueNameToQueueMap: Record<CreateMessageQueueNames, Queue>;

  public constructor(
    private readonly registrationDataService: RegistrationDataService,
    private readonly programAttributesService: ProgramAttributesService,
    private readonly queuesService: QueuesRegistryService,
  ) {
    this.queueNameToQueueMap = {
      [CreateMessageQueueNames.replyOnIncoming]:
        this.queuesService.createMessageReplyOnIncomingQueue,
      [CreateMessageQueueNames.smallBulk]:
        this.queuesService.createMessageSmallBulkQueue,
      [CreateMessageQueueNames.mediumBulk]:
        this.queuesService.createMessageMediumBulkQueue,
      [CreateMessageQueueNames.largeBulk]:
        this.queuesService.createMessageLargeBulkQueue,
      [CreateMessageQueueNames.lowPriority]:
        this.queuesService.createMessageLowPriorityQueue,
    };
  }

  public async addMessageJob({
    registration,
    message,
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
        preferredLanguage: registration.preferredLanguage ?? LanguageEnum.en,
        whatsappPhoneNumber,
        phoneNumber: registration.phoneNumber ?? undefined,
        programId: registration.projectId,
        message,
        messageTemplateKey,
        messageContentType,
        mediaUrl: mediaUrl ?? undefined,
        customData,
        userId,
      };
      const queue = this.queueNameToQueueMap[queueName];
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
      messageText = messageTemplate?.message;
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
