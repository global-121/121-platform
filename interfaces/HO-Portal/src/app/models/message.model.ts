export class Message {
  body: string;
  created: string;
  from: string;
  mediaurl: string;
  to: string;
  type: string;
  contentType: string;
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
  waiting = 'waiting',
  sent = 'sent',
  delivered = 'delivered',
  failed = 'failed',
  read = 'read',
}
