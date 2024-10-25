import { ActivitiesDto } from '@121-service/src/activities/dtos/activities.dto';
import { DataChangeActivity } from '@121-service/src/activities/interfaces/data-change-activity.interface';
import { FinancialServiceProviderChangeActivity } from '@121-service/src/activities/interfaces/financial-service-provider.interface';
import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { NoteActivity } from '@121-service/src/activities/interfaces/note-activity.interface';
import { StatusChangeActivity } from '@121-service/src/activities/interfaces/status-change-activity.interface';
import { TransactionActivity } from '@121-service/src/activities/interfaces/transaction-activity.interface';
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

// TODO: AB#30525 all of the stuff below should be removed and we should just reference the "IntersolveVisaWalletDto" from the 121-service
export enum VisaCard121Status {
  Active = 'Active',
  Blocked = 'Blocked',
  CardDataMissing = 'Debit Card Data Missing',
  Issued = 'Issued',
  Paused = 'Paused',
  Substituted = 'Substituted',
  SuspectedFraud = 'Suspected Fraud',
  Unknown = 'Unknown',
}

export enum VisaCardAction {
  pause = 'pause',
  reissue = 'reissue',
  unpause = 'unpause',
}

export enum IntersolveVisaCardStatus {
  CardBlocked = 'CARD_BLOCKED',
  CardClosed = 'CARD_CLOSED',
  CardClosedDueToFraud = 'CARD_CLOSED_DUE_TO_FRAUD',
  CardExpired = 'CARD_EXPIRED',
  CardLost = 'CARD_LOST',
  CardNoRenewal = 'CARD_NO_RENEWAL',
  CardOk = 'CARD_OK',
  CardStolen = 'CARD_STOLEN',
  SuspectedFraud = 'SUSPECTED_FRAUD',
}

export enum IntersolveVisaTokenStatus {
  Active = 'ACTIVE',
  Disabled = 'DISABLED',
  Expired = 'EXPIRED',
  Inactive = 'INACTIVE',
  Redeemed = 'REDEEMED',
  Substituted = 'SUBSTITUTED',
}

export class IntersolveVisaCardDebugInformation {
  public intersolveVisaCardStatus: IntersolveVisaCardStatus | null;
  public intersolveVisaTokenStatus: IntersolveVisaTokenStatus;
  public isTokenBlocked: boolean;
}

class IntersolveVisaCardDto {
  public tokenCode: string;
  public status: VisaCard121Status;
  public explanation: string;
  public issuedDate: Date;
  public actions: VisaCardAction[];
  public debugInformation: IntersolveVisaCardDebugInformation;
}

class IntersolveVisaWalletDto {
  public tokenCode: string;
  public balance: number;
  public spentThisMonth: number;
  public maxToSpendPerMonth: number;
  public lastUsedDate: Date | null;
  public lastExternalUpdate: null | string;
  public cards: IntersolveVisaCardDto[];
}

// TODO: AB#30152 This type should be refactored to use Dto121Service
export type WalletWithCards = Dto<IntersolveVisaWalletDto>;

export type SendMessageData =
  | { customMessage: string }
  | { messageTemplateKey: string };
