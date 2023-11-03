import { Injectable } from '@nestjs/common';
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
  ): Promise<MessageTemplateEntity[]> {
    const templates = await this.messageTemplateRepository.find({
      where: { programId: programId },
    });

    return await Promise.all(templates);
  }

  public async createMessageTemplate(
    postData: MessageTemplateDto,
  ): Promise<MessageTemplateEntity> {
    const template = new MessageTemplateEntity();
    template.programId = postData.programId;
    template.type = postData.type;
    template.language = postData.language;
    template.message = postData.message;
    template.isWhatsappTemplate = postData.isWhatsappTemplate;

    const saved = await this.messageTemplateRepository.save(template);

    return saved;
  }
}
