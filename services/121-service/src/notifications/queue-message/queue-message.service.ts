import {
  DEFAULT_QUEUE_CREATE_MESSAGE,
  MESSAGE_QUEUE_MAP,
  MessageQueueMap,
} from '@121-service/src/notifications/enum/message-queue-mapping.const';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import {
  ProcessNameMessage,
  QueueNameCreateMessage,
} from '@121-service/src/notifications/enum/queue.names.enum';
import {
  ExtendedMessageProccessType,
  MessageJobCustomDataDto,
  MessageJobDto,
  MessageProcessType,
  MessageProcessTypeExtension,
} from '@121-service/src/notifications/message-job.dto';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';

@Injectable()
export class QueueMessageService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;
  private readonly queueNameToQueueMap: Record<QueueNameCreateMessage, Queue>;

  public constructor(
    private readonly registrationDataService: RegistrationDataService,
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
  ) {
    this.queueNameToQueueMap = {
      [QueueNameCreateMessage.replyOnIncoming]:
        this.messageProcessorReplyOnIncoming,
      [QueueNameCreateMessage.smallBulk]: this.messageProcessorSmallBulk,
      [QueueNameCreateMessage.mediumBulk]: this.messageProcessorMediumBulk,
      [QueueNameCreateMessage.largeBulk]: this.messageProcessorLargeBulk,
      [QueueNameCreateMessage.lowPriority]: this.messageProcessorLowPriority,
    };
  }

  // TODO: REFACTOR: Rename to addMessageJob()
  public async addMessageToQueue({
    registration,
    message,
    messageTemplateKey,
    messageContentType,
    messageProcessType,
    mediaUrl,
    customData,
    bulksize,
  }: {
    registration: RegistrationEntity | Omit<RegistrationViewEntity, 'data'>;
    message?: string;
    messageTemplateKey?: string;
    messageContentType: MessageContentType;
    messageProcessType: ExtendedMessageProccessType;
    mediaUrl?: string | null;
    customData?: MessageJobCustomDataDto;
    bulksize?: number;
  }): Promise<void> {
    let whatsappPhoneNumber = registration['whatsappPhoneNumber'];
    if (registration instanceof RegistrationEntity) {
      whatsappPhoneNumber =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
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

    try {
      const queueName = this.getQueueName(messageProcessType, bulksize);
      const messageJob: MessageJobDto = {
        messageProcessType: messageProcessType,
        registrationId: registration.id,
        referenceId: registration.referenceId,
        preferredLanguage: registration.preferredLanguage ?? LanguageEnum.en,
        whatsappPhoneNumber: whatsappPhoneNumber,
        phoneNumber: registration.phoneNumber ?? undefined,
        programId: registration.programId,
        message,
        messageTemplateKey,
        messageContentType,
        mediaUrl: mediaUrl ?? undefined,
        customData,
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
          type: messageTemplateKey,
          programId: programId,
          language: 'en', // use english to determine which placeholders are used
        },
      });
      messageText = messageTemplate?.message;
    }
    const placeholders = await this.programAttributesService.getAttributes(
      programId,
      true,
      true,
      false,
      true,
    );
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
