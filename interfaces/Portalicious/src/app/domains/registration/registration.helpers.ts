import {
  ActivityLogItemType,
  ActivityLogItemWithOverview,
} from '~/domains/registration/registration.model';

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
