import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Equal, FindOptionsWhere, Repository } from 'typeorm';

import {
  CreateMessageTemplateDto,
  UpdateTemplateBodyDto,
} from '@121-service/src/notifications/message-template/dto/message-template.dto';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

@Injectable()
export class MessageTemplateService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;

  constructor(
    private readonly programAttributesService: ProgramAttributesService,
  ) {}

  public async getMessageTemplatesByProgramId(
    programId: number,
    type?: string,
    language?: LanguageEnum,
  ): Promise<MessageTemplateEntity[]> {
    let where: FindOptionsWhere<MessageTemplateEntity> = { programId };

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

  public async createMessageTemplate(
    programId: number,
    postData: CreateMessageTemplateDto,
  ): Promise<void> {
    const existingTemplate = await this.messageTemplateRepository.findOne({
      where: {
        programId: Equal(programId),
        type: Equal(postData.type),
        language: Equal(postData.language),
      },
    });
    if (existingTemplate) {
      const errors = `Message template with type '${postData.type}' and language '${postData.language}' already exists in program ${programId}`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    const template = new MessageTemplateEntity();
    template.programId = programId;
    template.type = postData.type;
    template.language = postData.language;
    template.label = postData.label;
    template.message = postData.message;
    template.isWhatsappTemplate = postData.isWhatsappTemplate;
    template.isSendMessageTemplate = postData.isSendMessageTemplate;

    await this.validatePlaceholders(programId, template.message);

    await this.messageTemplateRepository.save(template);
  }

  public async updateMessageTemplate(
    programId: number,
    type: string,
    language: LanguageEnum,
    updateMessageTemplateDto: UpdateTemplateBodyDto,
  ): Promise<MessageTemplateEntity> {
    const template = await this.messageTemplateRepository.findOne({
      where: {
        programId: Equal(programId),
        type: Equal(type),
        language: Equal(language),
      },
    });
    if (!template) {
      const errors = `No message template found with type '${type}' and language '${language}' in program ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    if (updateMessageTemplateDto.message) {
      await this.validatePlaceholders(
        programId,
        updateMessageTemplateDto.message,
      );
    }

    for (const key in updateMessageTemplateDto) {
      template[key] = updateMessageTemplateDto[key];
    }

    return await this.messageTemplateRepository.save(template);
  }

  public async deleteMessageTemplate(
    programId: number,
    messageType: string,
    language?: LanguageEnum,
  ): Promise<DeleteResult> {
    if (language) {
      return await this.messageTemplateRepository.delete({
        programId,
        type: messageType,
        language,
      });
    } else {
      return await this.messageTemplateRepository.delete({
        programId,
        type: messageType,
      });
    }
  }

  public async validatePlaceholders(
    programId: number,
    message: string,
  ): Promise<void> {
    const availableAttributes =
      await this.programAttributesService.getAttributes({
        programId,
        includeProgramRegistrationAttributes: true,
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
          const errors = `Placeholder ${match} not found in program ${programId}`;
          throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
        }
      }
    }
  }
}
