import { UserRO } from '@121-service/src/user/user.interface';

import { Dto } from '~/utils/dto-type';

export type User = Dto<UserRO>['user'];
