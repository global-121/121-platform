/**
 * Permissions in the 121-platform
 *
 * The naming convention used is similar to that of OAuth's scopes.
 * The format is:
 * `<entity>.<action>` or `<entity>:<sub-entity>.<action>`
 *
 * Where <action> is one of:
 * - create
 * - read
 * - update
 * - delete
 * - search (similar to read)
 * - export (similar to read)
 *
 * The format used in the keys of this Enum is slightly different because of TypeScript limitations on which characters can be used.
 * The format is:
 * <Entity><ACTION> or <Entity><Sub><ACTION>
 *
 */
export enum PermissionEnum {
  // Program(s)
  ProgramUPDATE = 'program.update',
  ProgramREAD = 'program.read',
  ProgramMetricsREAD = 'program:metrics.read',
  ProgramAttachmentsREAD = 'program:attachments.read',
  ProgramAttachmentsCREATE = 'program:attachments.create',
  ProgramAttachmentsDELETE = 'program:attachments.delete',

  // Payment(s)
  PaymentREAD = 'payment.read',
  PaymentCREATE = 'payment.create',
  PaymentUPDATE = 'payment.update', // TODO: update to PaymentTransactionUPDATE?
  PaymentRETRY = 'payment.retry',
  PaymentSTART = 'payment.start',
  PaymentFspInstructionREAD = 'payment:fsp-instruction.read',
  PaymentTransactionREAD = 'payment:transaction.read',

  // Payment(s) - Voucher(s)
  PaymentVoucherWhatsappREAD = 'payment:voucher-whatsapp.read',
  PaymentVoucherPaperREAD = 'payment:voucher-paper.read',
  PaymentVoucherExport = 'payment:voucher.export',

  // Fsp integration - Debit card(s)
  FspDebitCardREAD = 'fsp:debit-card.read',
  FspDebitCardBLOCK = 'fsp:debit-card.block',
  FspDebitCardUNBLOCK = 'fsp:debit-card.unblock',
  FspDebitCardCREATE = 'fsp:debit-card.create',
  FspDebitCardEXPORT = 'fsp:debit-card.export',

  // Registration(s)
  RegistrationREAD = 'registration.read',
  RegistrationCREATE = 'registration.create',
  RegistrationDELETE = 'registration.delete',

  RegistrationAttributeUPDATE = 'registration:attribute.update',
  RegistrationAttributeFinancialUPDATE = 'registration:attribute:financial.update',

  RegistrationFspConfigUPDATE = 'registration:fsp-config.update',

  RegistrationNotificationREAD = 'registration:notification.read',
  RegistrationNotificationCREATE = 'registration:notification.create',

  // Registration(s) - Personal
  // What is 'personal'?
  RegistrationPersonalREAD = 'registration:personal.read',
  RegistrationPersonalEXPORT = 'registration:personal.export',
  RegistrationPersonalUPDATE = 'registration:personal.update',
  RegistrationPaymentExport = 'registration:payment.export',

  // Registration(s) - Status
  RegistrationStatusMarkAsValidatedUPDATE = 'registration:status:markAsValidated.update',
  RegistrationStatusMarkAsDeclinedUPDATE = 'registration:status:markAsDeclined.update',
  RegistrationStatusIncludedUPDATE = 'registration:status:included.update',
  RegistrationStatusPausedUPDATE = 'registration:status:paused.update',

  // Registration(s) - Import
  RegistrationImportTemplateREAD = 'registration:import-template.read',

  // Registration(s) - Duplication
  RegistrationDuplicationDELETE = 'registration:duplication.delete',

  // Registrations - bulk
  RegistrationBulkUPDATE = 'registration:bulk.update',

  // User(s)
  AidWorkerProgramREAD = 'aid-worker:program.read',
  AidWorkerProgramUPDATE = 'aid-worker:program.update',
}
