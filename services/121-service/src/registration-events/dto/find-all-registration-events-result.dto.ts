import { Paginated } from 'nestjs-paginate';

import { PaginatedRegistrationEventDto } from '@121-service/src/registration-events/dto/paginated-registration-events.dto';
import { RegistrationEventViewEntity } from '@121-service/src/registration-events/entities/registration-event.view.entity';

export type FindAllRegistrationEventsResultDto = Omit<
  Paginated<RegistrationEventViewEntity>,
  'data'
> & { data: PaginatedRegistrationEventDto[] };
