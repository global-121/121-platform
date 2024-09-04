// Queues for sending messages
export enum ProcessNameMessage {
  send = 'send',
  sms = 'sms',
  whatsapp = 'whatsapp',
}

export enum QueueNameMessageCallBack {
  status = 'messageStatusCallback',
  incomingMessage = 'incomingMessage',
}

export enum QueueNameCreateMessage {
  replyOnIncoming = 'replyOnIncoming',
  smallBulk = 'smallBulk',
  mediumBulk = 'mediumBulk',
  largeBulk = 'largeBulk',
  lowPriority = 'lowPriority',
}

// Queues for updating registrations
export enum QueueNameRegistration {
  registration = 'registration',
}

export enum ProcessNameRegistration {
  update = 'updateRegistration',
}
