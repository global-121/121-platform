export interface ValidateRegistrationErrorObject {
  readonly lineNumber: number;
  readonly column: string;
  readonly error: string;
  readonly value: string | number | undefined | boolean;
}
