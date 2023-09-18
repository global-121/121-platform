import Permission from '../auth/permission.enum';

export class User {
  username: string;
  permissions: {
    [programId: number]: Permission[];
  };
  expires: string;
}

export interface Roles {
  id: number;
  role: string;
  label: string;
}

export interface TableData {
  active: boolean;
  admin: boolean;
  id: number;
  lastLogin: string;
  username: string;
}
