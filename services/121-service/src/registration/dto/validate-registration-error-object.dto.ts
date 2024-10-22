export interface ValidateRegistrationErrorObject {
  lineNumber: number;
  column: string;
  error: string;
  value: string | number | undefined | boolean;
}
