import Permission from '../auth/permission.enum';

export class User {
  username: string;
  permissions: {
    [programId: number]: Permission[];
  };
  expires: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  status: StatusName;
  lastActivity: string;
}

export enum StatusName {
  active = 'active',
  inactive = 'inactive',
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
