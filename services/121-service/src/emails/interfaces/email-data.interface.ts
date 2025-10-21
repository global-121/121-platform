export interface EmailData {
  readonly email: string;
  readonly subject: string;
  readonly body: string;
  readonly attachment?: {
    readonly name: string;
    readonly contentBytes: string;
  };
}
