import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { RegistrationPreferredLanguageEnum } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { LocalizedStringForUI } from '@121-service/src/shared/types/localized-string-for-ui.type';

export class MessageJobDto {
  messageProcessType: MessageProcessType;
  registrationId: number;
  referenceId: string;
  preferredLanguage: RegistrationPreferredLanguageEnum;
  whatsappPhoneNumber?: string;
  phoneNumber?: string;
  programId: number;
  message?: string;
  contentSid?: string;
  messageTemplateKey?: string;
  messageContentType?: MessageContentType;
  mediaUrl?: string;
  customData?: MessageJobCustomDataDto;
  userId: number;
}

export class MessageJobCustomDataDto {
  transactionData?: {
    transactionId?: number;
    intersolveVoucherId?: number;
    programFspConfigurationId?: number;
  };
  pendingMessageId?: number;
  existingMessageSid?: string;
  placeholderData?: Record<string, string | null | LocalizedStringForUI>;
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

// Used in places where custom message are send and it is not clear if Registration has WhatsApp
// This decision is made in the message-queues.service.ts
export enum MessageProcessTypeExtension {
  smsOrWhatsappTemplateGeneric = 'sms-or-whatsapp-template-generic',
}

export type ExtendedMessageProccessType =
  | MessageProcessType
  | MessageProcessTypeExtension;
