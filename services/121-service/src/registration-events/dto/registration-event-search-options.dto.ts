import { GetRegistrationEventsQueryDto } from '@121-service/src/registration-events/dto/get-registration-event-query.dto';

export class RegistrationEventSearchOptionsDto {
  registrationId?: number;
  queryParams?: GetRegistrationEventsQueryDto;
}
