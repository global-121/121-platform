export class AlfouadAuthIdentity {
  public readonly account: string;
  public readonly branchId: string;
  public readonly username: string;
  public readonly password: string;
  public readonly publicKey: string;

  public constructor({
    account,
    branchId,
    username,
    password,
    publicKey,
  }: {
    account: string;
    branchId: string;
    username: string;
    password: string;
    publicKey: string;
  }) {
    this.account = account;
    this.branchId = branchId;
    this.username = username;
    this.password = password;
    this.publicKey = publicKey;
  }

  // Redacts all credentials if this object is ever serialized/logged (e.g. via JSON.stringify).
  public toJSON(): string {
    return '**REDACTED**';
  }
}
