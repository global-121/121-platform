import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export interface UserData {
  id: number;
  username?: string;
  permissions: UserPermissions;
  isAdmin?: boolean;
  isEntraUser?: boolean;
  lastLogin?: Date;
  expires?: Date;
}

export interface UserRO {
  user: UserData;
}

export interface UserRequestData {
  id: number;
  username: string | null;
  exp: number;
  admin: boolean;
  scope: string;
}

type UserPermissions = Record<number, PermissionEnum[]>;
