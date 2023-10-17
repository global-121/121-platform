import Permission from '../auth/permission.enum';

export class User {
  username: string;
  permissions: {
    [programId: number]: Permission[];
  };
  expires: string;
  isAdmin?: boolean;
}

export class TeamMember {
  id: number;
  username: string;
  admin: boolean;
  active: boolean;
  lastLogin: Date;
  roles: Role[];
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
