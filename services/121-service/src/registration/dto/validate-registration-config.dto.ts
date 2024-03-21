export class ValidationConfigDto {
  validateUniqueReferenceId: boolean = true;
  validatePreferredLanguage: boolean = true;
  validateExistingReferenceId: boolean = true;
  validateScope: boolean = true;
  validatePhoneNumberEmpty: boolean = true;
  validatePhoneNumberLookup: boolean = true;
  validateDynamicAttributes: boolean = true;
  validateClassValidator: boolean = true;
}
