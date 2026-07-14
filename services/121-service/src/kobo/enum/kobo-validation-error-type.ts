/** @public */
export enum KoboValidationErrorType {
  missingField = 'missingField',
  typeMismatch = 'typeMismatch',
  invalidChoice = 'invalidChoice',
  formConfiguration = 'formConfiguration',
  forbiddenAttribute = 'forbiddenAttribute',
  missingEnglishLanguage = 'missingEnglishLanguage',
  matrixTypeFound = 'matrixTypeFound',
  repeatTypeFound = 'repeatTypeFound',
  invalidLanguageCode = 'invalidLanguageCode',
  selectOneNoChoices = 'selectOneNoChoices',
  missingFullnameAttributes = 'missingFullnameAttributes',
}
