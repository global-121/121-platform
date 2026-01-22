import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

export class MessageJobDto {
  messageProcessType: MessageProcessType;
  registrationId: number;
  referenceId: string;
  preferredLanguage: RegistrationPreferredLanguage;
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
  placeholderData?: Record<string, string | null | UILanguageTranslation>;
}

/**
 * We send different types (kinds) of messages. This enum defines those types.
 * The type determines _how_ a message should be sent
 * (MessageService.sendTextMessage) and how we handle a callback for a message
 * of that type.
 *
 * For Whatsapp: the state of a conversation with a registration can be either
 * "active"  or "inactive". This state is persisted on Whatsapp's end. The state
 * will move from "inactive" to "active" when a registration sends us a message,
 * either as a reply or self-initiated. The conversation state will
 * automatically become "inactive" again 24 hours after the last message we
 * receive from a registration.
 *
 * When the conversation is "inactive" we can only send "templated" messages.
 * When the conversation is "active" we can send any type of message.
 *
 * For Whatsapp messages we have the following subtypes:
 * - templated messages: these are pre-approved by Whatsapp and can be sent at
 *   any time.
 * - non-templated messages: can only be sent when the conversation is "active".
 * - pending messages: messages that will be sent when the conversation is
 *   active or as soon as it becomes "active" again. All pending messages are
 *   non-templated.
 */
export enum MessageProcessType {
  sms = 'sms',
  tryWhatsapp = 'try-whatsapp',

  /**
   * A templated message asking for a reply.
   */
  whatsappTemplateGeneric = 'whatsapp-template-generic',

  /**
   * A templated message, informing the receiver a voucher is available, asking
   * for a reply.
   */
  whatsappTemplateVoucher = 'whatsapp-template-voucher',

  /**
   * A templated message, reminding a registration that a voucher is available,
   * asking for a reply.
   */
  whatsappTemplateVoucherReminder = 'whatsapp-template-voucher-reminder',

  /**
   * A message that will be sent when the Whatsapp conversation is active or
   * becomes active again.
   */
  whatsappPendingMessage = 'whatsapp-pending-message',

  /**
   * A message that will be sent when the Whatsapp conversation is active or
   * becomes active again. Informs a registration that a voucher is available.
   */
  whatsappPendingVoucher = 'whatsapp-pending-voucher',

  /**
   * A message with a PDF attachment that's only sent along with
   * whatsappPendingVoucher.
   */
  whatsappVoucherInstructions = 'whatsapp-voucher-instructions',

  /**
   * We reply with this message when a user initiates a WhatsApp conversation
   * but we have no pending messages for them.
   */
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
