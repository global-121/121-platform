import { Paginated } from 'nestjs-paginate';

import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';

export type FindAllRegistrationsResultDto = Omit<
  Paginated<RegistrationViewEntity>,
  'data'
> & { data: MappedPaginatedRegistrationDto[] };
