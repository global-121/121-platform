import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';

export class MessageSizeType {
  message?: string;
  messageTemplateKey?: string;
  bulkSize: number;
  messageContentType: MessageContentType;
}
