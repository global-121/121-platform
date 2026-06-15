export enum KoboValidationErrorType {
  MissingField = 'missing_field',
  TypeMismatch = 'type_mismatch',
  InvalidChoice = 'invalid_choice',
  FormConfiguration = 'form_configuration',
  ForbiddenAttribute = 'forbidden_attribute',
}

type KoboFormConfigurationRule =
  | 'missing-english-language'
  | 'matrix-type-found'
  | 'invalid-language-code'
  | 'select-one-no-choices'
  | 'missing-fullname-attributes';

interface KoboMissingFieldError {
  type: KoboValidationErrorType.MissingField;
  attributeName: string;
  context?: string;
  message?: string;
}

interface KoboTypeMismatchError {
  type: KoboValidationErrorType.TypeMismatch;
  attributeName: string;
  expectedTypes: string[];
  actualType: string;
  message?: string;
}

interface KoboInvalidChoiceError {
  type: KoboValidationErrorType.InvalidChoice;
  attributeName: string;
  invalidChoices: string[];
  validChoices: string[];
  message?: string;
}

interface KoboFormConfigurationError {
  type: KoboValidationErrorType.FormConfiguration;
  rule: KoboFormConfigurationRule;
  detail?: string;
  message?: string;
}

interface KoboForbiddenAttributeError {
  type: KoboValidationErrorType.ForbiddenAttribute;
  attributeName: string;
  message?: string;
}

export type KoboValidationError =
  | KoboMissingFieldError
  | KoboTypeMismatchError
  | KoboInvalidChoiceError
  | KoboFormConfigurationError
  | KoboForbiddenAttributeError;
