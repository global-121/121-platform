import { ActivitiesDto } from '@121-service/src/activities/dtos/activities.dto';
import { DataChangeActivity } from '@121-service/src/activities/interfaces/data-change-activity.interface';
import { FspChangeActivity } from '@121-service/src/activities/interfaces/fsp-change.interface';
import { IgnoredDuplicateActivity } from '@121-service/src/activities/interfaces/ignored-duplicate-activity.interface';
import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { NoteActivity } from '@121-service/src/activities/interfaces/note-activity.interface';
import { StatusChangeActivity } from '@121-service/src/activities/interfaces/status-change-activity.interface';
import { TransactionActivity } from '@121-service/src/activities/interfaces/transaction-activity.interface';
import { BulkActionResultDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { DuplicateReponseDto } from '@121-service/src/registration/dto/duplicate-response.dto';
import { FindAllRegistrationsResultDto } from '@121-service/src/registration/dto/find-all-registrations-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { Dto } from '~/utils/dto-type';

export type Registration = Dto<MappedPaginatedRegistrationDto> &
  Record<string, unknown>; // The Registration entity has a lot of properties, but they are dynamic based on the program configuration so we don't know them in advance

export type FindAllRegistrationsResult = {
  data: Registration[]; // We need to manually remap the data property to the correct type because otherwise the dto type doesn't know how to handle the "unknown" properties defined above
} & Omit<Dto<FindAllRegistrationsResultDto>, 'data'>;

export type ChangeStatusResult = Dto<BulkActionResultDto>;
export type DuplicatesResult = Dto<DuplicateReponseDto>;

// The discriminated union type doesn't play well with our Dto utility type, so we need to define the Activity type manually
export type Activity =
  | Dto<DataChangeActivity>
  | Dto<FspChangeActivity>
  | Dto<IgnoredDuplicateActivity>
  | Dto<MessageActivity>
  | Dto<NoteActivity>
  | Dto<StatusChangeActivity>
  | Dto<TransactionActivity>;

export type ActitivitiesResponse = {
  data: Activity[];
} & Dto<Omit<ActivitiesDto, 'data'>>;

export type SendMessageData =
  | { customMessage: string }
  | { messageTemplateKey: string };

export type RegistrationStatusChangeTarget = Exclude<
  RegistrationStatusEnum,
  RegistrationStatusEnum.completed | RegistrationStatusEnum.new
>;
