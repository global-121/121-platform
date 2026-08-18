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

export const getRegistrationUpdateDialogSubmitLabel = ({
  status,
  count,
}: {
  status: RegistrationStatusEnum | undefined;
  count: number | undefined;
}): string => {
  switch (status) {
    case RegistrationStatusEnum.included:
      return count === 1
        ? $localize`:@@registration-status-dialog-submit-button-labels-include:Include registration`
        : $localize`:@@registration-status-dialog-submit-button-labels-include-plural:Include registrations`;
    case RegistrationStatusEnum.declined:
      return count === 1
        ? $localize`:@@registration-status-dialog-submit-button-labels-decline:Decline registration`
        : $localize`:@@registration-status-dialog-submit-button-labels-decline-plural:Decline registrations`;
    case RegistrationStatusEnum.validated:
      return count === 1
        ? $localize`:@@registration-status-dialog-submit-button-labels-validate:Validate registration`
        : $localize`:@@registration-status-dialog-submit-button-labels-validate-plural:Validate registrations`;
    case RegistrationStatusEnum.deleted:
      return count === 1
        ? $localize`:@@registration-status-dialog-submit-button-labels-delete:Delete registration`
        : $localize`:@@registration-status-dialog-submit-button-labels-delete-plural:Delete registrations`;
    case RegistrationStatusEnum.paused:
      return count === 1
        ? $localize`:@@registration-status-dialog-submit-button-labels-pause:Pause registration`
        : $localize`:@@registration-status-dialog-submit-button-labels-pause-plural:Pause registrations`;
    default:
      return $localize`:@@generic-approve:Approve`;
  }
};

export const getChangeStatusWarningMessage = ({
  status,
}: {
  status: RegistrationStatusEnum | undefined;
}): string => {
  switch (status) {
    case RegistrationStatusEnum.validated:
      return $localize`:@@change-status-validate-warning:The action "Validate" can only be applied to registrations with the "New" status.`;
    case RegistrationStatusEnum.included:
      return $localize`:@@change-status-include-warning:The action "Include" can only be applied to registrations that do not have status "Included" and whose “Payments left” is larger than 0.`;
    case RegistrationStatusEnum.paused:
      return $localize`:@@change-status-pause-warning:The action "Pause" can only be applied to registrations with the "Included" status.`;
    case RegistrationStatusEnum.declined:
      return $localize`:@@change-status-decline-warning:The action "Decline" can not be applied to registrations with the "Declined" or "Completed" status.`;
    case RegistrationStatusEnum.deleted:
      return $localize`:@@change-status-delete-warning:The action "Delete" can not be applied to registrations with the "Completed" status.`;
    default:
      return $localize`:@@change-status-default-warning:This action can not be applied to registrations you have selected.`;
  }
};

export const REGISTRATION_STATUS_PENDING_APPROVAL_EXPLANATION: Partial<
  Record<RegistrationStatusEnum, string>
> = {
  [RegistrationStatusEnum.declined]: $localize`:@@change-status-declined-pending-approval-explanation:Declining a registration included in a payment will exclude them from that payment. To ensure they still receive their transfer, cancel this action and decline them after payment.`,
  [RegistrationStatusEnum.paused]: $localize`:@@change-status-paused-pending-approval-explanation:Pausing a registration that’s included in a payment will result in a failed transfer. If you include them in the future, you’ll be able to retry the failed payment.`,
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
