import { UserController } from '@121-service/src/user/user.controller';
import { Dto121Service } from '~/utils/dto-type';

export type User = Dto121Service<UserController['login']>['user'];
