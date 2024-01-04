import { PermissionEnum } from './enum/permission.enum';

export interface UserData {
  username: string;
  token: string;
  permissions: UserPermissions;
  isAdmin?: boolean;
}

export interface UserRO {
  user: UserData;
}

export interface UserToken {
  id: number;
  username: string;
  exp: number;
  admin: boolean;
}

export type UserPermissions = Record<number, PermissionEnum[]>;
