import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';
import { ActivityLogTableCellContext } from '~/pages/project-registration-activity-log/project-registration-activity-log.page';

@Component({
  selector: 'app-activity-log-expanded-row',
  standalone: true,
  imports: [DataListComponent],
  templateUrl: './activity-log-expanded-row.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogExpandedRowComponent
  implements TableCellComponent<Activity, ActivityLogTableCellContext>
{
  private readonly projectApiService = inject(ProjectApiService);

  value = input.required<Activity>();
  context = input.required<ActivityLogTableCellContext>();

  intersolveVoucherBalance = injectQuery(() => ({
    ...this.projectApiService.getIntersolveVoucherBalance({
      projectId: this.context().projectId,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      registrationReferenceId: this.context().referenceId!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      paymentId: this.paymentId()!,
    })(),
    enabled: () => this.isIntersolveVoucher() && !!this.context().referenceId,
  }));

  isIntersolveVoucher = computed(() => {
    const activity = this.value();

    return (
      activity.type === ActivityTypeEnum.Transaction &&
      activity.attributes.fsp ===
        FinancialServiceProviders.intersolveVoucherWhatsapp
    );
  });

  paymentId = computed(() => {
    const activity = this.value();
    return activity.type === ActivityTypeEnum.Transaction
      ? activity.attributes.payment
      : undefined;
  });

  dataList = computed<DataListItem[] | undefined>(() => {
    const item = this.value();
    switch (item.type) {
      case ActivityTypeEnum.DataChange:
        return [
          {
            label: $localize`Old data`,
            value: item.attributes.oldValue,
          },
          {
            label: $localize`New data`,
            value: item.attributes.newValue,
          },
          {
            label: $localize`Change reason`,
            value: item.attributes.reason,
          },
        ];
      case ActivityTypeEnum.StatusChange:
        return [
          {
            label: $localize`Old status`,
            value: REGISTRATION_STATUS_LABELS[item.attributes.oldValue],
          },
          {
            label: $localize`New status`,
            value: REGISTRATION_STATUS_LABELS[item.attributes.newValue],
          },
        ];
      case ActivityTypeEnum.Transaction: {
        const list: DataListItem[] = [
          {
            label: $localize`Sent`,
            value: item.attributes.paymentDate,
            type: 'date',
          },
          {
            label: $localize`Received`,
            value: item.attributes.paymentDate,
            type: 'date',
          },
          {
            label: $localize`Approved by`,
            chipLabel: item.user.username,
            chipVariant: 'blue',
          },
          {
            label: $localize`FSP`,
            value: item.attributes.fsp,
          },
          {
            label: $localize`Amount`,
            value: item.attributes.amount,
            type: 'currency',
          },
        ];

        if (this.isIntersolveVoucher()) {
          list.push({
            label: $localize`Current balance`,
            value: this.intersolveVoucherBalance.data(),
            type: 'currency',
            loading: this.intersolveVoucherBalance.isLoading(),
          });
        }

        return list;
      }
      default:
        return undefined;
    }
  });

  message = computed<string | undefined>(() => {
    const item = this.value();
    switch (item.type) {
      case ActivityTypeEnum.Note:
        return item.attributes.text;
      case ActivityTypeEnum.Message:
        return item.attributes.body;
      default:
        return undefined;
    }
  });
}
