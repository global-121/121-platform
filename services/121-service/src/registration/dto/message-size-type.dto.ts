import { MessageContentType } from '../../notifications/enum/message-type.enum';

export class MessageSizeType {
  message?: string;
  messageTemplateKey?: string;
  bulkSize: number;
  messageContentType: MessageContentType;
}
