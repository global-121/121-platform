export class UserModel {
  token: string;
}

export class User {
  token?: string;
  username: string;
  permissions: string[];
}
