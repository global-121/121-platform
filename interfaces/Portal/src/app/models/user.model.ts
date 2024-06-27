import { UserController } from '@121-service/src/user/user.controller';
import { Dto121Service } from '../shared/utils/dto-type';

export type User = Dto121Service<UserController['login']>['user'];

export enum UserType {
  admin = 'admin',
  regular = 'regular',
}

export class UserSearchResult {
  id: number;
  username: string;
  assignedProgramIds: number[];
}

export class TeamMember {
  id: number;
  username: string;
  admin: boolean;
  active: boolean;
  lastLogin: Date;
  roles: Role[];
  scope?: string;
}

export class TeamMemberRow extends TeamMember {
  showTeamMemberPopover: boolean;
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
