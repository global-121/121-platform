export class PasswordResetEvent {
  constructor(
    public readonly email: string,
    public readonly displayName: string,
    public readonly password: string,
  ) {}
}
