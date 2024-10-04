import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ChipModule } from 'primeng/chip';

import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { getChipDataByTransactionStatusEnum } from '~/components/colored-chip/colored-chip.helper';
import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';
import {
  ActivityLogItemType,
  ActivityLogItemWithOverview,
} from '~/domains/registration/registration.model';
import { ActivityLogVoucherDialogComponent } from '~/pages/project/project-registrations/project-registration-activity-log/components/activity-log-voucher-dialog/activity-log-voucher-dialog.component';
import { ActivityLogTableCellContext } from '~/pages/project/project-registrations/project-registration-activity-log/project-registration-activity-log.page';

@Component({
  selector: 'app-table-cell-overview',
  standalone: true,
  imports: [
    ChipModule,
    ColoredChipComponent,
    ActivityLogVoucherDialogComponent,
  ],
  template: `
    <span class="inline-flex w-full items-center">
      {{ value().overview }}

      @if (chipData()) {
        <app-colored-chip
          [label]="chipData()!.chipLabel"
          [variant]="chipData()!.chipVariant"
          class="ms-2"
        />
      }

      @let dialogData = voucherDialogData();
      @if (dialogData) {
        <app-activity-log-voucher-dialog
          [projectId]="dialogData.projectId"
          [paymentId]="dialogData.paymentId"
          [totalTransfers]="dialogData.totalTransfers"
          [voucherReferenceId]="dialogData.voucherReferenceId"
          class="ms-auto"
        />
      }
    </span>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellOverviewComponent
  implements
    TableCellComponent<
      ActivityLogItemWithOverview,
      ActivityLogTableCellContext
    >
{
  value = input.required<ActivityLogItemWithOverview>();
  context = input.required<ActivityLogTableCellContext>();

  chipData = computed(() => {
    const { activityType, contents } = this.value();

    if (activityType !== ActivityLogItemType.Transfer) {
      return;
    }

    return getChipDataByTransactionStatusEnum(contents.status);
  });

  voucherDialogData = computed(() => {
    const item = this.value();
    const referenceId = this.context().referenceId;

    if (!referenceId) {
      return;
    }

    if (
      item.activityType !== ActivityLogItemType.Transfer ||
      item.contents.fsp !==
        FinancialServiceProviderName.intersolveVoucherWhatsapp
    ) {
      return;
    }

    return {
      projectId: this.context().projectId(),
      paymentId: item.contents.payment,
      totalTransfers: item.contents.totalTransfers,
      voucherReferenceId: referenceId,
    };
  });
}
