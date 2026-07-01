import { ProgramEntity } from "@121-service/src/programs/entities/program.entity";

export const propertiesToDuplicate: Record<keyof ProgramEntity, boolean> = {
  // Primary and audit columns
  id: true,
  created: true,
  updated: true,

  // Columns
  location: true,
  titlePortal: true,
  ngo: true,
  startDate: false,
  endDate: false,
  currency: true,
  distributionFrequency: true,
  distributionDuration: true,
  fixedTransferValue: true,
  paymentAmountMultiplierFormula: true,
  targetNrRegistrations: true,
  description: true,
  validation: true,
  fullnameNamingConvention: true,
  languages: true,
  enableMaxPayments: true,
  enableScope: true,
  budget: false,
  monitoringDashboardUrl: false,
  allowEmptyPhoneNumber: true,
  paymentsAreLocked: false,

  // Non-persisted property
  editableAttributes: true,

  // One-to-many relations
  aidworkerAssignments: true,
  programRegistrationAttributes: true,
  registrations: true,
  payments: true,
  programFspConfigurations: true,
  messageTemplates: true,
  attachments: true,

  // One-to-one relations
  kobo: true,
};
