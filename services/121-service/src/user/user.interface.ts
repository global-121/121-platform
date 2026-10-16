import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export interface UserData {
  id: number;
  username?: string;
  permissions: UserPermissions;
  isAdmin?: boolean;
  isEntraUser?: boolean;
  lastLogin?: Date;
  expires?: Date;
  displayName?: string;
  isOrganizationAdmin?: boolean;
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
  accessGroups: AssignedAccessGroupResult[];
  isOrganizationAdmin: boolean;
}

type UserPermissions = Record<number, PermissionEnum[]>;
