import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import {
  ActivityLogItemType,
  ActivityLogItemWithOverview,
  TransferActivity,
} from '~/domains/registration/registration.model';

@Component({
  selector: 'app-activity-log-expanded-row',
  standalone: true,
  imports: [DataListComponent],
  templateUrl: './activity-log-expanded-row.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogExpandedRowComponent
  implements TableCellComponent<ActivityLogItemWithOverview>
{
  private readonly projectApiService = inject(ProjectApiService);

  value = input.required<ActivityLogItemWithOverview>();
  context = input.required<{
    projectId: Signal<number>;
    referenceId: string;
  }>();

  intersolveVoucherBalance = injectQuery(() => ({
    ...this.projectApiService.getIntersolveVoucherBalance({
      projectId: this.context().projectId,
      registrationReferenceId: this.context().referenceId,
      paymentId: (this.value() as TransferActivity).contents.transferNumber,
    })(),
    enabled: () => this.shouldShowVoucherBalance(),
  }));

  shouldShowVoucherBalance = computed(() => {
    return (
      this.value().activityType === ActivityLogItemType.Transfer &&
      (this.value() as TransferActivity).contents.fsp === 'Intersolve'
    );
  });

  dataList = computed<DataListItem[] | undefined>(() => {
    const item = this.value();
    switch (item.activityType) {
      case ActivityLogItemType.DataChange:
        return [
          {
            label: $localize`Old data`,
            value: item.contents.oldData,
          },
          {
            label: $localize`New data`,
            value: item.contents.newData,
          },
          {
            label: $localize`Change reason`,
            value: item.contents.changeReason,
          },
        ];
      case ActivityLogItemType.StatusUpdate:
        return [
          {
            label: $localize`Old status`,
            value: REGISTRATION_STATUS_LABELS[item.contents.oldStatus],
          },
          {
            label: $localize`New status`,
            value: REGISTRATION_STATUS_LABELS[item.contents.newStatus],
          },
        ];
      case ActivityLogItemType.Transfer: {
        const list: DataListItem[] = [
          {
            label: $localize`Sent`,
            value: item.contents.sent,
            type: 'date',
          },
          {
            label: $localize`Received`,
            value: item.contents.received,
            type: 'date',
          },
          {
            label: $localize`Approved by`,
            chipLabel: item.contents.approvedBy,
            chipVariant: 'blue',
          },
          {
            label: $localize`FSP`,
            value: item.contents.fsp,
          },
          {
            label: $localize`Amount`,
            value: item.contents.amount,
            type: 'currency',
          },
        ];

        if (this.shouldShowVoucherBalance()) {
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
    switch (item.activityType) {
      case ActivityLogItemType.Note:
        return item.contents.note;
      case ActivityLogItemType.Message:
        return item.contents.message;
      default:
        return undefined;
    }
  });
}
