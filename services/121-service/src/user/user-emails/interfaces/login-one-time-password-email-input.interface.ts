export interface LoginOneTimePasswordEmailInput {
  readonly email: string;
  readonly recipientName: string;
  readonly oneTimePassword: string;
  readonly expirationMinutes: number;
}
