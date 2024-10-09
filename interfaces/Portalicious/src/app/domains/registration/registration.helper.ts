import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
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
