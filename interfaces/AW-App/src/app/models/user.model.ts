import { UserRole } from '../auth/user-role.enum';

export class User {
  token: string;
  email: string;
  roles: UserRole[];
}
