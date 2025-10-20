import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';

export const MESSAGE_CONTENT_TYPE_LABELS: Record<MessageContentType, string> = {
  [MessageContentType.custom]: $localize`:@@message-content-type-custom:Custom message`,
  [MessageContentType.defaultReply]: $localize`:@@message-content-type-default-reply:Default reply`,
  [MessageContentType.genericTemplated]: $localize`:@@message-content-type-generic-templated:Message notification`,
  [MessageContentType.included]: $localize`:@@message-content-type-included:Inclusion`,
  [MessageContentType.invited]: $localize`:@@message-content-type-invited:Invitation for registration`,
  [MessageContentType.payment]: $localize`:@@message-content-type-payment:Payment`,
  [MessageContentType.paymentInstructions]: $localize`:@@message-content-type-payment-instructions:Payment instructions`,
  [MessageContentType.paymentReminder]: $localize`:@@message-content-type-payment-reminder:Payment reminder`,
  [MessageContentType.paymentTemplated]: $localize`:@@message-content-type-payment-templated:Payment notification`,
  [MessageContentType.paymentVoucher]: $localize`:@@message-content-type-payment-voucher:Payment voucher`,
  [MessageContentType.paused]: $localize`:@@message-content-type-paused:Paused`,
  [MessageContentType.new]: $localize`:@@message-content-type-new:New`,
  [MessageContentType.completed]: $localize`:@@message-content-type-completed:Completed`,
};

export enum MessageStatus {
  delivered = 'delivered',
  failed = 'failed',
  read = 'read',
  sent = 'sent',
  unknown = 'unknown',
}

const TwilioMessageStatusMapping: Record<string, MessageStatus> = {
  accepted: MessageStatus.sent,
  delivered: MessageStatus.delivered,
  delivery_unknown: MessageStatus.sent,
  failed: MessageStatus.failed,
  queued: MessageStatus.sent,
  read: MessageStatus.read,
  scheduled: MessageStatus.sent,
  sending: MessageStatus.sent,
  sent: MessageStatus.sent,
  undelivered: MessageStatus.failed,
};

export const convertTwilioMessageStatusToMessageStatus = (
  status: string,
): MessageStatus => TwilioMessageStatusMapping[status] ?? MessageStatus.unknown;

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  [MessageStatus.delivered]: $localize`:@@message-status-delivered:Delivered`,
  [MessageStatus.failed]: $localize`:@@message-status-failed:Failed`,
  [MessageStatus.read]: $localize`:@@message-status-read:Read`,
  [MessageStatus.sent]: $localize`:@@message-status-sent:Sent`,
  [MessageStatus.unknown]: $localize`:@@message-status-unknown:Unknown`,
};
