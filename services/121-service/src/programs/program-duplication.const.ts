// Single source of truth for which direct relations of a Program are copied
// when a Program is duplicated (see `ProgramService.duplicateProgram`).
//
// Every relation declared on `ProgramEntity` must be classified here as either
// "to duplicate" or "not to duplicate". This is enforced by a guard test
// (`program-duplication.const.spec.ts`) that fails when a new relation is added
// to `ProgramEntity` without being classified, forcing a conscious decision.

export const programRelationsToDuplicate = ['aidworkerAssignments'] as const;

export const programRelationsNotToDuplicate = [
  'programFspConfigurations',
  'messageTemplates',
  'programRegistrationAttributes',
  'registrations',
  'payments',
  'attachments',
  'kobo',
] as const;
