/** @public */
export enum ActivityInfoValidationErrorType {
  missingField = 'missingField',
  typeMismatch = 'typeMismatch',
  invalidChoice = 'invalidChoice',
  forbiddenAttribute = 'forbiddenAttribute',
  missingFieldCode = 'missingFieldCode',
  unsupportedLanguage = 'unsupportedLanguage',
  subFormFound = 'subFormFound',
  singleSelectNoChoices = 'singleSelectNoChoices',
  missingFullnameAttributes = 'missingFullnameAttributes',
}
