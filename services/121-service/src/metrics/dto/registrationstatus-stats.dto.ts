import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export class RegistrationStatusStats {
  status: WrapperType<RegistrationStatusEnum>;
  count: number;
}
