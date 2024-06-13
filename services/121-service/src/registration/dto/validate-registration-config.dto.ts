export class ValidationConfigDto {
  validateUniqueReferenceId = true;
  validatePreferredLanguage = true;
  validateExistingReferenceId = true;
  validateScope = true;
  validatePhoneNumberEmpty = true;
  validatePhoneNumberLookup = true;
  validateClassValidator = true;

  constructor(init?: Partial<ValidationConfigDto>) {
    Object.assign(this, init);
  }
}
