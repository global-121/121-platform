import Permission from '../auth/permission.enum';

export class UserModel {
  token: string;
}

export class User {
  username: string;
  permissions: Permission[];
  expires: string;
}
