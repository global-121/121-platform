import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MessageTemplateEntity } from './message-template.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { MessageTemplateDto } from './dto/message-template.dto';
import { LanguageEnum } from '../../registration/enum/language.enum';
import { ProgramAttributesService } from '../../program-attributes/program-attributes.service';

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
    language?: string,
  ): Promise<MessageTemplateEntity[]> {
    let where: any = { programId: programId };

    if (type) {
      where = { ...where, type: type };
    }

    if (language) {
      where = { ...where, language: language };
    }

    return await this.messageTemplateRepository.find({
      where: where,
    });
  }

  public async createMessageTemplate(
    programId: number,
    postData: MessageTemplateDto,
  ): Promise<void> {
    const template = new MessageTemplateEntity();
    template.programId = programId;
    template.type = postData.type;
    template.language = postData.language;
    template.message = postData.message;
    template.isWhatsappTemplate = postData.isWhatsappTemplate;

    await this.validatePlaceholders(programId, template.message);

    await this.messageTemplateRepository.save(template);
  }

  public async updateMessageTemplate(
    programId: number,
    messageId: number,
    updateMessageTemplateDto: MessageTemplateDto,
  ): Promise<MessageTemplateEntity> {
    const template = await this.messageTemplateRepository.findOne({
      where: { programId: programId, id: messageId },
    });
    if (!template) {
      const errors = `No message template found with id ${messageId} in program ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    if (updateMessageTemplateDto.message) {
      await this.validatePlaceholders(
        programId,
        updateMessageTemplateDto.message,
      );
    }

    for (const key in updateMessageTemplateDto) {
      if (key !== 'template') {
        template[key] = updateMessageTemplateDto[key];
      }
    }

    return await this.messageTemplateRepository.save(template);
  }

  public async deleteMessageTemplate(
    programId: number,
    messageType: string,
    language: LanguageEnum,
  ): Promise<DeleteResult> {
    if (language) {
      return await this.messageTemplateRepository.delete({
        programId: programId,
        type: messageType,
        language: language,
      });
    } else {
      return await this.messageTemplateRepository.delete({
        programId: programId,
        type: messageType,
      });
    }
  }

  public async validatePlaceholders(
    programId: number,
    message: string,
  ): Promise<void> {
    const availableAttributes =
      await this.programAttributesService.getAttributes(
        programId,
        true,
        true,
        false,
      );
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
