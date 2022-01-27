import Permission from '../auth/permission.enum';

export class UserModel {
  token: string;
}

export class User {
  token?: string;
  username: string;
  permissions: Permission[];
}
