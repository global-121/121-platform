import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';

export type MappedPaginatedRegistrationDto = Omit<
  RegistrationViewEntity,
  'data'
> & { name?: string };
