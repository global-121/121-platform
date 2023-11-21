import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MessageTemplateEntity } from './message-template.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplateDto } from './dto/message-template.dto';

@Injectable()
export class MessageTemplateService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;

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

    for (const key in updateMessageTemplateDto) {
      if (key !== 'template') {
        template[key] = updateMessageTemplateDto[key];
      }
    }

    return await this.messageTemplateRepository.save(template);
  }
}
