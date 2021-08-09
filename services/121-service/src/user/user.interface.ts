import { UserRoleEntity } from './user-role.entity';

export interface UserData {
  username: string;
  token: string;
  roles: UserRoleEntity[];
}
export interface UserRO {
  user: UserData;
}
