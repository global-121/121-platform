export enum MessageContentType {
  registered = 'registered',
  included = 'included',
  inclusionEnded = 'inclusion-ended',
  rejected = 'rejected',
  invited = 'invited',
  paused = 'paused',
  custom = 'custom',
  genericTemplated = 'generic-templated',
  paymentTemplated = 'payment-templated', // This is only used for AH vouchers
  payment = 'payment',
  paymentInstructions = 'payment-instructions', // This is only used for AH vouchers
  paymentVoucher = 'payment-voucher',
  paymentReminder = 'payment-reminder',
  defaultReply = 'default-reply',
}

export const TemplatedMessages = [
  MessageContentType.genericTemplated,
  MessageContentType.paymentTemplated,
];
