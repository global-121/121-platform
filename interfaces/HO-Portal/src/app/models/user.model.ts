import Permission from '../auth/permission.enum';
import { UserRole } from '../auth/user-role.enum';

export class UserModel {
  token: string;
}

export class User {
  token?: string;
  username: string;
  roles?: UserRole[];
  permissions: Permission[];
}
