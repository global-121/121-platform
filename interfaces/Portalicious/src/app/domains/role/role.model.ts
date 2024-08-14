import { UserController } from '@121-service/src/user/user.controller';
import { Dto121Service } from '~/utils/dto-type';

export type Role = Dto121Service<UserController['getUserRoles']>[0];
