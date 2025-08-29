import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Equal, FindOptionsWhere, Repository } from 'typeorm';

import { ContentSidMessageTypes } from '@121-service/src/notifications/message-template/const/content-sid-message-types.const';
import {
  CreateMessageTemplateDto,
  UpdateTemplateBodyDto,
} from '@121-service/src/notifications/message-template/dto/message-template.dto';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { ProjectAttributesService } from '@121-service/src/project-attributes/project-attributes.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

@Injectable()
export class MessageTemplateService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;

  constructor(
    private readonly projectAttributesService: ProjectAttributesService,
  ) {}

  public async getMessageTemplatesByProjectId(
    projectId: number,
    type?: string,
    language?: LanguageEnum,
  ): Promise<MessageTemplateEntity[]> {
    let where: FindOptionsWhere<MessageTemplateEntity> = { projectId };

    if (type) {
      where = { ...where, type };
    }

    if (language) {
      where = { ...where, language };
    }

    return await this.messageTemplateRepository.find({
      where,
    });
  }

  private validateMessageAndContentSid({
    message,
    contentSid,
    type,
  }: {
    message: string | undefined;
    contentSid: string | undefined;
    type: string;
  }): void {
    if ((ContentSidMessageTypes as string[]).includes(type)) {
      if (!contentSid) {
        const errors = `Content SID is required for message types: ${ContentSidMessageTypes.join(
          ', ',
        )}`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    } else {
      if (contentSid) {
        const errors = `Content SID is not allowed for messages that are not of type: ${ContentSidMessageTypes.join(
          ', ',
        )}`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
      if (!message) {
        const errors = `Message is required for message type '${type}'`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    }
  }

  public async createMessageTemplate(
    projectId: number,
    postData: CreateMessageTemplateDto,
  ): Promise<void> {
    this.validateMessageAndContentSid({
      message: postData.message,
      contentSid: postData.contentSid,
      type: postData.type,
    });

    const existingTemplate = await this.messageTemplateRepository.findOne({
      where: {
        projectId: Equal(projectId),
        type: Equal(postData.type),
        language: Equal(postData.language),
      },
    });
    if (existingTemplate) {
      const errors = `Message template with type '${postData.type}' and language '${postData.language}' already exists in project ${projectId}`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    const template = new MessageTemplateEntity();
    template.projectId = projectId;
    template.type = postData.type;
    template.language = postData.language;
    template.label = postData.label;
    template.message = postData.message ?? null;
    template.contentSid = postData.contentSid ?? null;
    template.isSendMessageTemplate = postData.isSendMessageTemplate;

    if (template.message) {
      await this.validatePlaceholders(projectId, template.message);
    }

    await this.messageTemplateRepository.save(template);
  }

  public async updateMessageTemplate(
    projectId: number,
    type: string,
    language: LanguageEnum,
    updateMessageTemplateDto: UpdateTemplateBodyDto,
  ): Promise<MessageTemplateEntity> {
    const template = await this.messageTemplateRepository.findOne({
      where: {
        projectId: Equal(projectId),
        type: Equal(type),
        language: Equal(language),
      },
    });
    if (!template) {
      const errors = `No message template found with type '${type}' and language '${language}' in project ${projectId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    this.validateMessageAndContentSid({
      message: updateMessageTemplateDto.message,
      contentSid: updateMessageTemplateDto.contentSid,
      type: template.type,
    });

    if (updateMessageTemplateDto.message) {
      await this.validatePlaceholders(
        projectId,
        updateMessageTemplateDto.message,
      );
    }

    for (const key in updateMessageTemplateDto) {
      template[key] = updateMessageTemplateDto[key];
    }

    return await this.messageTemplateRepository.save(template);
  }

  public async deleteMessageTemplate(
    projectId: number,
    messageType: string,
    language?: LanguageEnum,
  ): Promise<DeleteResult> {
    if (language) {
      return await this.messageTemplateRepository.delete({
        projectId,
        type: messageType,
        language,
      });
    } else {
      return await this.messageTemplateRepository.delete({
        projectId,
        type: messageType,
      });
    }
  }

  public async validatePlaceholders(
    projectId: number,
    message: string,
  ): Promise<void> {
    const availableAttributes =
      await this.projectAttributesService.getAttributes({
        projectId,
        includeProjectRegistrationAttributes: true,
        includeTemplateDefaultAttributes: true,
      });
    const availablePlaceholders = availableAttributes.map(
      (a) => `{{${a.name}}}`,
    );
    const regex = /{{[^}]+}}/g;
    const matches = message.match(regex);

    // This 'if' is needed because matches can be null if no placeholders are found
    if (matches) {
      for (const match of matches) {
        const isPlaceholderAllowed = availablePlaceholders.includes(match);
        if (!isPlaceholderAllowed) {
          const errors = `Placeholder ${match} not found in project ${projectId}`;
          throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
        }
      }
    }
  }
}
