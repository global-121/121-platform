import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';

export type MappedPaginatedRegistrationDto = Omit<
  RegistrationViewEntity,
  'data'
> & // It's hard to predict what will be in the output of `mapPaginatedEntity`,
  // because of the way the response is built dynamically, so here we are adding
  // potential extra fields that we know could exist.
  // They are all wrapped with a Partial<> as an extra safety measure, given that we
  // don't have any guarantee from TS that they will be there.
  Partial<{ name: string; fullName: string }>;
