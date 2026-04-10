export interface ValidateRegistrationErrorObject {
  readonly column: string;
  readonly error: string;
  readonly value: string | number | undefined | boolean | null;
}
