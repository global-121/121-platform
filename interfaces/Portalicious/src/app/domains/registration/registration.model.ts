import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Dto } from '~/utils/dto-type';

export type Registration = Dto<RegistrationEntity>;
export type RegistrationView = Dto<RegistrationViewEntity>;
