import { ActivitiesDto } from '@121-service/src/activities/dtos/activities.dto';
import { DataChangeActivity } from '@121-service/src/activities/interfaces/data-change-activity.interface';
import { FinancialServiceProviderChangeActivity } from '@121-service/src/activities/interfaces/financial-service-provider.interface';
import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { NoteActivity } from '@121-service/src/activities/interfaces/note-activity.interface';
import { StatusChangeActivity } from '@121-service/src/activities/interfaces/status-change-activity.interface';
import { TransactionActivity } from '@121-service/src/activities/interfaces/transaction-activity.interface';

import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { FindAllRegistrationsResultDto } from '@121-service/src/registration/dto/find-all-registrations-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';

import { Dto } from '~/utils/dto-type';

// TODO: AB#30152 This type should be refactored to use Dto121Service
export type Registration = Dto<MappedPaginatedRegistrationDto>;
// TODO: AB#30152 This type should be refactored to use Dto121Service
export type FindAllRegistrationsResult = Dto<FindAllRegistrationsResultDto>;

// The discriminated union type doesn't play well with our Dto utility type, so we need to define the Activity type manually
export type Activity =
  | Dto<DataChangeActivity>
  | Dto<FinancialServiceProviderChangeActivity>
  | Dto<MessageActivity>
  | Dto<NoteActivity>
  | Dto<StatusChangeActivity>
  | Dto<TransactionActivity>;

export type ActitivitiesResponse = {
  data: Activity[];
} & Dto<Omit<ActivitiesDto, 'data'>>;

// TODO: AB#30152 This type should be refactored to use Dto121Service
export type WalletWithCards = Dto<IntersolveVisaWalletDto>;
