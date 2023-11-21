import { LanguageEnum } from '../registration/enum/language.enum';
import { MessageContentType } from './enum/message-type.enum';

export class MessageJobDto {
  messageProcessType: MessageProccessType;
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
  mediaUrl?: string;
  customData?: MessageJobCustomDataDto;
}

export class MessageJobCustomDataDto {
  payment?: number;
  amount?: number;
  intersolveVoucherId?: number;
  replyMessage?: boolean;
  pendingMessageId?: number;
  existingMessageSid?: string;
}

export enum MessageProccessType {
  sms = 'sms',
  whatsappTemplateGeneric = 'whatsapp-template-generic',
  whatappTemplateVoucher = 'whatsapp-template-voucher',
  whatsappTemplateVoucherReminder = 'whatsapp-template-voucher-reminder',
  whatsappPendingInformation = 'whatsapp-pending-information',
  whatsappPendingVoucher = 'whatsapp-pending-voucher',
  whatsappNoPendingMessages = 'whatsapp-no-pending-messages',
  tryWhatsapp = 'try-whatsapp',
}

// Used in places where custom message are send and it is not clear if registration has whatsapp
// This decision is made in the queue-message.service.ts
export enum MessageProcessTypeExtenstion {
  smsOrWhatsappTemplateGeneric = 'sms-or-whatsapp-template-generic',
}

export type ExtendedMessageProccessType =
  | MessageProccessType
  | MessageProcessTypeExtenstion;
