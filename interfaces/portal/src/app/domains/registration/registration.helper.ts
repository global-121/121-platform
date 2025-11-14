import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

import { AppRoutes } from '~/app.routes';

export const REGISTRATION_STATUS_LABELS: Record<
  RegistrationStatusEnum,
  string
> = {
  [RegistrationStatusEnum.included]: $localize`:@@registration-status-included:Included`,
  [RegistrationStatusEnum.new]: $localize`:@@registration-status-new:New`,
  [RegistrationStatusEnum.validated]: $localize`:@@registration-status-validated:Validated`,
  [RegistrationStatusEnum.declined]: $localize`:@@registration-status-declined:Declined`,
  [RegistrationStatusEnum.completed]: $localize`:@@registration-status-completed:Completed`,
  [RegistrationStatusEnum.deleted]: $localize`:@@registration-status-deleted:Deleted`,
  [RegistrationStatusEnum.paused]: $localize`:@@registration-status-paused:Paused`,
};

export const REGISTRATION_STATUS_ICON: Record<RegistrationStatusEnum, string> =
  {
    [RegistrationStatusEnum.new]: '',
    [RegistrationStatusEnum.completed]: '',
    [RegistrationStatusEnum.validated]: 'pi pi-check-circle',
    [RegistrationStatusEnum.included]: 'pi pi-check',
    [RegistrationStatusEnum.paused]: 'pi pi-pause',
    [RegistrationStatusEnum.declined]: 'pi pi-ban',
    [RegistrationStatusEnum.deleted]: 'pi pi-trash',
  };

export const REGISTRATION_STATUS_VERB: Record<RegistrationStatusEnum, string> =
  {
    [RegistrationStatusEnum.new]: $localize`Register`,
    [RegistrationStatusEnum.completed]: $localize`Complete`,
    [RegistrationStatusEnum.validated]: $localize`Validate`,
    [RegistrationStatusEnum.included]: $localize`Include`,
    [RegistrationStatusEnum.paused]: $localize`Pause`,
    [RegistrationStatusEnum.declined]: $localize`Decline`,
    [RegistrationStatusEnum.deleted]: $localize`Delete`,
  };

export const DUPLICATE_STATUS_LABELS: Record<DuplicateStatus, string> = {
  [DuplicateStatus.duplicate]: $localize`:@@duplicate-status-duplicate:Duplicate`,
  [DuplicateStatus.unique]: $localize`:@@duplicate-status-unique:Unique`,
};

export const LANGUAGE_ENUM_LABEL: Record<LanguageEnum, string> = {
  ar: $localize`Arabic`,
  en: $localize`English`,
  es: $localize`Spanish`,
  fr: $localize`French`,
  in: $localize`Indonesian`,
  nl: $localize`Dutch`,
  pt_BR: $localize`Portuguese`,
  sk: $localize`Slovak`,
  tl: $localize`Filipino`,
  tr: $localize`Turkish`,
  uk: $localize`Ukrainian`,
};

export const VISA_CARD_STATUS_LABELS: Record<VisaCard121Status, string> = {
  [VisaCard121Status.Active]: $localize`:@@debit-card-status-active:Active`,
  [VisaCard121Status.Issued]: $localize`:@@debit-card-status-issued:Issued`,
  [VisaCard121Status.Blocked]: $localize`:@@debit-card-status-blocked:Blocked`,
  [VisaCard121Status.Paused]: $localize`:@@debit-card-status-paused:Paused`,
  [VisaCard121Status.SuspectedFraud]: $localize`:@@debit-card-status-suspected-fraud:Suspected fraud`,
  [VisaCard121Status.Unknown]: $localize`:@@debit-card-status-unknown:Unknown`,
  [VisaCard121Status.Substituted]: $localize`:@@debit-card-status-substituted:Substituted`,
  [VisaCard121Status.CardDataMissing]: $localize`:@@debit-card-status-card-data-missing:Debit card data missing`,
};

export const ACTIVITY_LOG_ITEM_TYPE_LABELS: Record<ActivityTypeEnum, string> = {
  [ActivityTypeEnum.DataChange]: $localize`:@@activity-log-item-type-data-change:Data change`,
  [ActivityTypeEnum.FspChange]: $localize`:@@activity-log-item-type-fsp-change:FSP change`,
  [ActivityTypeEnum.Message]: $localize`:@@activity-log-item-type-message:Message`,
  [ActivityTypeEnum.Note]: $localize`:@@activity-log-item-type-note:Note`,
  [ActivityTypeEnum.StatusChange]: $localize`:@@activity-log-item-type-status-update:Status update`,
  [ActivityTypeEnum.Transaction]: $localize`:@@activity-log-item-type-transfer:Transfer`,
  [ActivityTypeEnum.IgnoredDuplicate]: $localize`:@@activity-log-item-type-duplication:Duplication`,
};

export const ACTIVITY_LOG_ITEM_TYPE_ICONS: Record<ActivityTypeEnum, string> = {
  [ActivityTypeEnum.DataChange]: 'pi pi-pencil',
  [ActivityTypeEnum.FspChange]: 'pi pi-pencil',
  [ActivityTypeEnum.Message]: 'pi pi-envelope',
  [ActivityTypeEnum.Note]: 'pi pi-pen-to-square',
  [ActivityTypeEnum.StatusChange]: 'pi pi-refresh',
  [ActivityTypeEnum.Transaction]: 'pi pi-money-bill',
  [ActivityTypeEnum.IgnoredDuplicate]: 'pi pi-clone',
};

export const registrationLink = ({
  programId,
  registrationId,
}: {
  programId: number | string;
  registrationId: number | string;
}) => [
  '/',
  AppRoutes.program,
  programId,
  AppRoutes.programRegistrations,
  registrationId,
];
