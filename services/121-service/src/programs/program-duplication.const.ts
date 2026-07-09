import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { EntityDuplicationTree } from '@121-service/src/utils/entity-duplication/duplicate-entity.helper';

export const propertiesToDuplicate: Record<
  keyof ProgramEntity,
  boolean | EntityDuplicationTree
> = {
  // Primary and audit columns
  id: false,
  created: false,
  updated: false,

  // Columns
  location: true,
  titlePortal: true,
  ngo: true,
  startDate: true,
  endDate: true,
  currency: true,
  distributionFrequency: true,
  distributionDuration: true,
  fixedTransferValue: true,
  paymentAmountMultiplierFormula: true,
  targetNrRegistrations: true,
  description: true,
  validation: true,
  fullnameNamingConvention: false,
  languages: true,
  enableMaxPayments: true,
  enableScope: true,
  budget: true,
  monitoringDashboardUrl: false,
  allowEmptyPhoneNumber: true,
  paymentsAreLocked: false,

  // Non-persisted property
  editableAttributes: false,

  // One-to-many relations
  aidworkerAssignments: true,
  programRegistrationAttributes: false,
  registrations: false,
  payments: false,
  programFspConfigurations: {
    // Also duplicate the configuration's properties (e.g. credentials,
    // columnToMatch) so the copied program's FSP configurations stay functional.
    properties: true,
  },
  messageTemplates: false,
  attachments: false,

  // One-to-one relations
  kobo: false,
};
