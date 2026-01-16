import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

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

export const ACTIVITY_LOG_ITEM_TYPE_LABELS: Record<ActivityTypeEnum, string> = {
  [ActivityTypeEnum.DataChange]: $localize`:@@activity-log-item-type-data-change:Data change`,
  [ActivityTypeEnum.FspChange]: $localize`:@@activity-log-item-type-fsp-change:FSP change`,
  [ActivityTypeEnum.Message]: $localize`:@@activity-log-item-type-message:Message`,
  [ActivityTypeEnum.Note]: $localize`:@@activity-log-item-type-note:Note`,
  [ActivityTypeEnum.StatusChange]: $localize`:@@activity-log-item-type-status-update:Status update`,
  [ActivityTypeEnum.Transaction]: $localize`:@@activity-log-item-type-transaction:Transaction`,
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
