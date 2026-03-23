export interface ImportValidationFailedEmailInput {
  readonly email: string;
  readonly recipientName: string;
  readonly attachment: {
    readonly name: string;
    readonly contentBytes: string;
  };
}
