import Permission from '../auth/permission.enum';

export class User {
  username: string;
  permissions: Permission[];
}
