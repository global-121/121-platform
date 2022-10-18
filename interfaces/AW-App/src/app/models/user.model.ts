import Permission from '../auth/permission.enum';

export class UserModel {
  token: string;
}

export class User {
  username: string;
  permissions: {
    [programId: number]: Permission[];
  };
  expires: string;
}
