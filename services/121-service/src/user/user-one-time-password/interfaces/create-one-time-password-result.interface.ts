export interface CreateOneTimePasswordResult {
  readonly oneTimePassword: string;
  readonly expiresAt: Date;
}
