import { UserEmailType } from '@121-service/src/user/user-emails/enum/user-email-type.enum';

export class AccountCreatedEvent {
  constructor(
    public readonly email: string,
    public readonly displayName: string,
    public readonly password: string,
    public readonly userEmailType: UserEmailType,
  ) {}
}
