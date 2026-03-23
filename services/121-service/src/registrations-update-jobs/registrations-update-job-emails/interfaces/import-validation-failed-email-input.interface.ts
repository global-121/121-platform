export interface ImportValidationFailedEmailInput {
  readonly email: string;
  readonly displayName: string;
  readonly attachment: {
    readonly name: string;
    readonly contentBytes: string;
  };
}
