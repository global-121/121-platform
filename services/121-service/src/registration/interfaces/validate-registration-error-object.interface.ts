export interface ValidateRegistrationErrorObject {
  readonly index: number;
  readonly referenceId?: string;
  readonly column: string;
  readonly error: string;
  readonly value: string | number | undefined | boolean | null;
}
