export enum ProcessName {
  send = 'send',
  sms = 'sms',
  whatsapp = 'whatsapp',
}

export enum QueueNameMessageBallBack {
  messageStatusCallback = 'messageStatusCallback',
}

export enum QueueNameCreateMessage {
  replyOnIncoming = 'messagePriority100',
  smallBulk = 'messagePriority200',
  mediumBulk = 'messagePriority300',
  largeBulk = 'messagePriority400',
  voucherReminder = 'messagePriority500',
}
