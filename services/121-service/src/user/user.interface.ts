import { UserRoleEntity } from './user-role.entity';

export interface UserData {
  email: string;
  token: string;
  roles: UserRoleEntity[];
}

export interface UserRO {
  user: UserData;
}
