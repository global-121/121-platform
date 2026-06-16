export enum KoboValidationErrorType {
  MissingField = 'missing_field',
  TypeMismatch = 'type_mismatch',
  InvalidChoice = 'invalid_choice',
  FormConfiguration = 'form_configuration',
  ForbiddenAttribute = 'forbidden_attribute',
  MissingEnglishLanguage = 'missing-english-language',
  MatrixTypeFound = 'matrix-type-found',
  InvalidLanguageCode = 'invalid-language-code',
  SelectOneNoChoices = 'select-one-no-choices',
  MissingFullnameAttributes = 'missing-fullname-attributes',
}
export interface KoboValidationErrorBase {
  type: KoboValidationErrorType;
  field: string;
  error: string;
  solution: string;
  info?: string;
  message: string; // Legacy message
}
