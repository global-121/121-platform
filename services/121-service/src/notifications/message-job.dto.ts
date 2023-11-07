import { LanguageEnum } from '../registration/enum/language.enum';
import { MessageContentType } from './enum/message-type.enum';

export class MessageJobDto {
  id: number;
  referenceId: string;
  preferredLanguage: LanguageEnum;
  whatsappPhoneNumber: string;
  phoneNumber: string;
  programId: number;
  message?: string;
  key?: string;
  tryWhatsApp? = false;
  messageContentType?: MessageContentType;
}
