export interface UserEmailTemplateInput {
  readonly email: string;
  readonly displayName: string;
  readonly password?: string;
  readonly attachment?: {
    readonly name: string;
    readonly contentBytes: string;
  };
}
