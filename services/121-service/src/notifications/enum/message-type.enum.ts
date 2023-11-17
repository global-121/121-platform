export enum MessageContentType {
  registered = 'registered',
  included = 'included',
  inclusionEnded = 'inclusion-ended',
  rejected = 'rejected',
  invited = 'invited',
  paused = 'paused',
  custom = 'custom',
  genericTemplated = 'generic-templated',
  paymentTemplated = 'payment-templated',
  payment = 'payment',
  paymentInstructions = 'payment-instructions',
  paymentReminder = 'payment-reminder',
  defaultReply = 'default-reply',
}

export const ReplacedByGenericTemplateMessageTypes = [
  MessageContentType.registered,
  MessageContentType.included,
  MessageContentType.inclusionEnded,
  MessageContentType.rejected,
  MessageContentType.invited,
  MessageContentType.paused,
  MessageContentType.custom,
];

export const TemplatedMessages = [
  MessageContentType.genericTemplated,
  MessageContentType.paymentTemplated,
];
