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
 * - export (simlar to read)
 *
 * The format used in the keys of this Enum is slightly different because of TypeScript limitations on which characters can be used.
 * The format is:
 * <Entity><ACTION> or <Entity><Sub><ACTION>
 *
 */
export enum PermissionEnum {
  // Program(s)
  ProgramUPDATE = 'program.update',
  ProgramPhaseUPDATE = 'program:phase.update',
  ProgramQuestionUPDATE = 'program:question.update',
  ProgramQuestionDELETE = 'program:question.delete',
  ProgramCustomAttributeUPDATE = 'program:custom-attribute.update',
  ProgramMetricsREAD = 'program:metrics.read',

  // Payment(s)
  PaymentREAD = 'payment.read',
  PaymentCREATE = 'payment.create',
  PaymentFspInstructionREAD = 'payment:fsp-instruction.read',
  PaymentTransactionREAD = 'payment:transaction.read',

  // Payment(s) - Voucher(s)
  PaymentVoucherREAD = 'payment:voucher.read',

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
  RegistrationAttributeFinacialUPDATE = 'registration:attribute:financial.update',

  RegistrationFspREAD = 'registration:fsp.read',
  RegistrationFspUPDATE = 'registration:fsp.update',

  RegistrationNotificationREAD = 'registration:notification.read',
  RegistrationNotificationCREATE = 'registration:notification.create',

  // Registration(s) - Personal
  // What is 'personal'?
  RegistrationPersonalREAD = 'registration:personal.read',
  RegistrationPersonalForValidationREAD = 'registration:personal:for-valdation.read',
  RegistrationPersonalEXPORT = 'registration:personal.export',
  RegistrationPersonalUPDATE = 'registration:personal.update',

  // Registration(s) - Status
  RegistrationStatusSelectedForValidationUPDATE = 'registration:status:selectedForValidation.update',
  RegistrationStatusNoLongerEligibleUPDATE = 'registration:status:noLongerEligible.update',
  RegistrationStatusIncludedUPDATE = 'registration:status:included.update',
  RegistrationStatusRejectedUPDATE = 'registration:status:rejected.update',
  RegistrationStatusInclusionEndedUPDATE = 'registration:status:inclusionEnded.update',
  RegistrationStatusInvitedUPDATE = 'registration:status:invited.update',
  RegistrationStatusPausedUPDATE = 'registration:status:paused.update',

  // Registration(s) - Import
  RegistrationImportTemplateREAD = 'registration:import-template.read',

  // Action(s)
  ActionREAD = 'action.read',
  ActionCREATE = 'action.create',

  // User(s)
  AidWorkerProgramREAD = 'aid-worker:program.read',
  AidWorkerProgramUPDATE = 'aid-worker:program.update',
}
