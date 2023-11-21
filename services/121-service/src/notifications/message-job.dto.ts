import { LanguageEnum } from '../registration/enum/language.enum';
import { MessageContentType } from './enum/message-type.enum';

export class MessageJobDto {
  messageProcessType: MessageProcessType;
  registrationId: number;
  referenceId: string;
  preferredLanguage: LanguageEnum;
  whatsappPhoneNumber: string;
  phoneNumber: string;
  programId: number;
  message?: string;
  key?: string;
  messageContentType?: MessageContentType;
  mediaUrl?: string;
  customData?: MessageJobCustomDataDto;
}

export class MessageJobCustomDataDto {
  payment?: number;
  amount?: number;
  intersolveVoucherId?: number;
  pendingMessageId?: number;
  existingMessageSid?: string;
}

export enum MessageProcessType {
  sms = 'sms',
  tryWhatsapp = 'try-whatsapp',
  whatsappTemplateGeneric = 'whatsapp-template-generic',
  whatsappPendingMessage = 'whatsapp-pending-message',
  whatsappTemplateVoucher = 'whatsapp-template-voucher',
  whatsappTemplateVoucherReminder = 'whatsapp-template-voucher-reminder',
  whatsappPendingVoucher = 'whatsapp-pending-voucher',
  whatsappVoucherInstructions = 'whatsapp-voucher-instructions',
  whatsappDefaultReply = 'whatsapp-default-reply',
}

// Used in places where custom message are send and it is not clear if registration has whatsapp
// This decision is made in the queue-message.service.ts
export enum MessageProcessTypeExtension {
  smsOrWhatsappTemplateGeneric = 'sms-or-whatsapp-template-generic',
}

export type ExtendedMessageProccessType =
  | MessageProcessType
  | MessageProcessTypeExtension;
