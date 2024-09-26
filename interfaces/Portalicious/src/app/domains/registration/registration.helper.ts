import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import {
  ActivityLogItemType,
  ActivityLogItemWithOverview,
} from '~/domains/registration/registration.model';

export const REGISTRATION_STATUS_LABELS: Record<
  RegistrationStatusEnum,
  string
> = {
  [RegistrationStatusEnum.included]: $localize`:@@registration-status-included:Included`,
  [RegistrationStatusEnum.registered]: $localize`:@@registration-status-registered:Registered`,
  [RegistrationStatusEnum.validated]: $localize`:@@registration-status-validated:Validated`,
  [RegistrationStatusEnum.declined]: $localize`:@@registration-status-declined:Declined`,
  [RegistrationStatusEnum.completed]: $localize`:@@registration-status-completed:Completed`,
  [RegistrationStatusEnum.deleted]: $localize`:@@registration-status-deleted:Deleted`,
  [RegistrationStatusEnum.paused]: $localize`:@@registration-status-paused:Paused`,
};

export const ACTIVITY_LOG_ITEM_TYPE_LABELS: Record<
  ActivityLogItemType,
  string
> = {
  [ActivityLogItemType.DataChange]: $localize`:@@activity-log-item-type-data-change:Data change`,
  [ActivityLogItemType.Message]: $localize`:@@activity-log-item-type-message:Message`,
  [ActivityLogItemType.Note]: $localize`:@@activity-log-item-type-note:Note`,
  [ActivityLogItemType.StatusUpdate]: $localize`:@@activity-log-item-type-status-update:Status update`,
  [ActivityLogItemType.Transfer]: $localize`:@@activity-log-item-type-transfer:Transfer`,
};

export const ACTIVITY_LOG_ITEM_TYPE_ICONS: Record<ActivityLogItemType, string> =
  {
    [ActivityLogItemType.DataChange]: 'pi pi-pencil',
    [ActivityLogItemType.Message]: 'pi pi-envelope',
    [ActivityLogItemType.Note]: 'pi pi-pen-to-square',
    [ActivityLogItemType.StatusUpdate]: 'pi pi-refresh',
    [ActivityLogItemType.Transfer]: 'pi pi-money-bill',
  };

/**
 * Example usage:
 *
 * if (isActivityType<TransferActivity>(item, ActivityType.Transfer)) {
 *  console.log(log.transferNumber); // TypeScript now knows this is a TransferActivity!
 * }
 */
export function isActivityType<TType extends ActivityLogItemWithOverview>(
  activity: TType,
  type: ActivityLogItemType,
): activity is TType {
  return activity.activityType === type;
}
