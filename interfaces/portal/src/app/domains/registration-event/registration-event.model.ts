import { FindAllRegistrationEventsResultDto } from '@121-service/src/registration-events/dto/find-all-registration-events-result.dto';
import { PaginatedRegistrationEventDto } from '@121-service/src/registration-events/dto/paginated-registration-events.dto';

import { Dto } from '~/utils/dto-type';

export type RegistrationEvent = Dto<PaginatedRegistrationEventDto>;

export type FindAllRegistrationEventsResult = {
  data: RegistrationEvent[]; // We need to manually remap the data property to the correct type because otherwise the dto type doesn't know how to handle the "unknown" properties defined above
} & Omit<Dto<FindAllRegistrationEventsResultDto>, 'data'>;
