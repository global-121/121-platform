import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';

export type MappedPaginatedRegistrationDto = Omit<
  RegistrationViewEntity,
  'data'
> & { name?: string };
