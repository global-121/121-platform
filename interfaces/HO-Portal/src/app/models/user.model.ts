import Permission from '../auth/permission.enum';

export class User {
  username: string;
  permissions: {
    [programId: number]: Permission[];
  };
  expires: string;
  isAdmin?: boolean;
}

export interface TableData {
  active: boolean;
  admin: boolean;
  id: number;
  lastLogin: string;
  username: string;
}

export interface Role {
  id: number;
  role: string;
  label: string;
}
