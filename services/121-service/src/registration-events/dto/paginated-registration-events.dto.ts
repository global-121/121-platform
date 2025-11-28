import { RegistrationEventViewEntity } from '@121-service/src/registration-events/entities/registration-event.view.entity';

// This type exists to make our frontend happy, as it cannot deal with typeorm types
// It cannot deal with circular type references, such as User → ProgramAssignment → Program → User
export type PaginatedRegistrationEventDto = Omit<
  RegistrationEventViewEntity,
  'user'
>;
