export enum KoboValidationErrorType {
  MissingField = 'missing_field',
  TypeMismatch = 'type_mismatch',
  InvalidChoice = 'invalid_choice',
  FormConfiguration = 'form_configuration',
  ForbiddenAttribute = 'forbidden_attribute',
}

export type KoboFormConfigurationRule =
  | 'missing-english-language'
  | 'matrix-type-found'
  | 'invalid-language-code'
  | 'select-one-no-choices'
  | 'missing-fullname-attributes';

export type KoboValidationError =
  | {
      type: KoboValidationErrorType.MissingField;
      attributeName: string;
      context?: string;
      message?: string;
    }
  | {
      type: KoboValidationErrorType.TypeMismatch;
      attributeName: string;
      expectedTypes: string[];
      actualType: string;
      message?: string;
    }
  | {
      type: KoboValidationErrorType.InvalidChoice;
      attributeName: string;
      invalidChoices: string[];
      validChoices: string[];
      message?: string;
    }
  | {
      type: KoboValidationErrorType.FormConfiguration;
      rule: KoboFormConfigurationRule;
      detail?: string;
      message?: string;
    }
  | {
      type: KoboValidationErrorType.ForbiddenAttribute;
      attributeName: string;
      message?: string;
    };
