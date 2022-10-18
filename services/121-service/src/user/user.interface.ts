import { PermissionEnum } from './permission.enum';

export interface UserData {
  username: string;
  token: string;
  permissions: UserPermissions;
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

export interface UserPermissions {
  [programId: number]: PermissionEnum[];
}
