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
