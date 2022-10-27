import Permission from '../auth/permission.enum';

export class User {
  username: string;
  permissions: {
    [programId: number]: Permission[];
  };
  expires: string;
}
