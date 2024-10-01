import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

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
import { ActivityLogTableCellContext } from '~/pages/project/project-registrations/project-registration-activity-log/project-registration-activity-log.page';

@Component({
  selector: 'app-activity-log-expanded-row',
  standalone: true,
  imports: [DataListComponent],
  templateUrl: './activity-log-expanded-row.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogExpandedRowComponent
  implements
    TableCellComponent<
      ActivityLogItemWithOverview,
      ActivityLogTableCellContext
    >
{
  private readonly projectApiService = inject(ProjectApiService);

  value = input.required<ActivityLogItemWithOverview>();
  context = input.required<ActivityLogTableCellContext>();

  intersolveVoucherBalance = injectQuery(() => ({
    ...this.projectApiService.getIntersolveVoucherBalance({
      projectId: this.context().projectId,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      registrationReferenceId: this.context().referenceId!,
      paymentId: (this.value() as TransferActivity).contents.payment,
    })(),
    enabled: () => this.isIntersolveVoucher() && !!this.context().referenceId,
  }));

  isIntersolveVoucher = computed(() => {
    return (
      this.value().activityType === ActivityLogItemType.Transfer &&
      (this.value() as TransferActivity).contents.fsp ===
        FinancialServiceProviderName.intersolveVoucherWhatsapp
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
