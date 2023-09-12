export enum RegistrationStatusLabel {
  imported = 'Imported',
  invited = 'Invited',
  noLongerEligible = 'No longer eligible',
  startedRegistration = 'Created',
  registered = 'Registered',
  registeredWhileNoLongerEligible = 'Registered while no longer eligible',
  selectedForValidation = 'Selected for Validation',
  validated = 'Validated',
  included = 'Included',
  inclusionEnded = 'Inclusion ended',
  rejected = 'Rejected',
  completed = 'Completed',
}

// Refactor the existing const to use the enum
export const RegistrationStatusLabelMapping = {
  imported: RegistrationStatusLabel.imported,
  invited: RegistrationStatusLabel.invited,
  noLongerEligible: RegistrationStatusLabel.noLongerEligible,
  startedRegistration: RegistrationStatusLabel.startedRegistration,
  registered: RegistrationStatusLabel.registered,
  registeredWhileNoLongerEligible:
    RegistrationStatusLabel.registeredWhileNoLongerEligible,
  selectedForValidation: RegistrationStatusLabel.selectedForValidation,
  validated: RegistrationStatusLabel.validated,
  included: RegistrationStatusLabel.included,
  inclusionEnded: RegistrationStatusLabel.inclusionEnded,
  rejected: RegistrationStatusLabel.rejected,
  completed: RegistrationStatusLabel.completed,
};
