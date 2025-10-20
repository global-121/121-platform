export enum MessageContentType {
  included = 'included',
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
  new = 'new',
  completed = 'completed',
}

export const TemplatedMessages = [
  MessageContentType.genericTemplated,
  MessageContentType.paymentTemplated,
];
