export enum MessageContentType {
  registered = 'registered',
  included = 'included',
  inclusionEnded = 'inclusion-ended',
  rejected = 'rejected',
  invited = 'invited',
  custom = 'custom',
  genericTemplated = 'generic-templated',
  paymentTemplated = 'payment-templated',
  payment = 'payment',
  paymentInstructions = 'payment-instructions',
  paymentReminder = 'payment-reminder',
  defaultReply = 'default-reply',
}

export const TemplatedMessages = [
  MessageContentType.genericTemplated,
  MessageContentType.paymentTemplated,
];
