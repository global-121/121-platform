import { TranslatableString } from './translatable-string.model';

export class Message {
  body: string;
  created: string;
  from: string;
  mediaurl: string;
  to: string;
  type: string;
  contentType: string;
  errorCode: string;
  status: TwilioStatus;
  messageStatus: MessageStatus;
}

export enum TwilioStatus {
  accepted = 'accepted',
  scheduled = 'scheduled',
  queued = 'queued',
  sending = 'sending',
  sent = 'sent',
  delivery_unknown = 'delivery-unknown',
  delivered = 'delivered',
  undelivered = 'undelivered',
  failed = 'failed',
  read = 'read',
}

export enum MessageStatus {
  sent = 'sent',
  delivered = 'delivered',
  failed = 'failed',
  read = 'read',
}

export enum MessageStatusMapping {
  accepted = MessageStatus.sent,
  delivered = MessageStatus.delivered,
  delivery_unknown = MessageStatus.sent,
  failed = MessageStatus.failed,
  queued = MessageStatus.sent,
  read = MessageStatus.read,
  scheduled = MessageStatus.sent,
  sending = MessageStatus.sent,
  sent = MessageStatus.sent,
  undelivered = MessageStatus.failed,
}

export class MessageTemplate {
  id: number;
  created: string;
  updated: string;
  type: string;
  label: TranslatableString;
  language: string;
  message: string;
  isWhatsappTemplate: true;
  isSendMessageTemplate: true;
  programId: number;
}
