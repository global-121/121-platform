import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';

export interface MessageContentDetails {
  message?: string;
  messageTemplateKey?: string;
  messageContentType?: MessageContentType;
}
