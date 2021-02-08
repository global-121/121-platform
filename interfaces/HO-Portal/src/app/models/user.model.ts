import { UserRole } from '../auth/user-role.enum';

export class UserModel {
  token: string;
}

export class User {
  token?: string;
  email: string;
  roles: UserRole[] | any; // During transition, use 'any'
  role?: UserRole | 'aidworker' | 'project-officer' | 'program-manager'; // Define 'Legacy' users
}
