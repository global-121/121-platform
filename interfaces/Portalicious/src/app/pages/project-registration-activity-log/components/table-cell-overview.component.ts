import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ChipModule } from 'primeng/chip';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import {
  ChipData,
  getChipDataByRegistrationStatus,
  getChipDataByTransactionStatusEnum,
  getChipDataByTwilioMessageStatus,
} from '~/components/colored-chip/colored-chip.helper';
import { TableCellComponent } from '~/components/query-table/table-cell/table-cell.component';
import { MESSAGE_CONTENT_TYPE_LABELS } from '~/domains/message/message.helper';
import { ACTIVITY_LOG_ITEM_TYPE_LABELS } from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';
import { ActivityLogVoucherDialogComponent } from '~/pages/project-registration-activity-log/components/activity-log-voucher-dialog/activity-log-voucher-dialog.component';
import { ActivityLogTableCellContext } from '~/pages/project-registration-activity-log/project-registration-activity-log.page';

@Component({
  selector: 'app-table-cell-overview',
  standalone: true,
  imports: [
    ChipModule,
    ColoredChipComponent,
    ActivityLogVoucherDialogComponent,
    NgClass,
  ],
  template: `
    <div class="flex w-full content-between items-center">
      @if (!!overview()) {
        <span class="me-auto">{{ overview() }}</span>
      }

      @let dialogData = voucherDialogData();
      @if (dialogData) {
        <app-activity-log-voucher-dialog
          [projectId]="dialogData.projectId"
          [paymentId]="dialogData.paymentId"
          [totalTransfers]="dialogData.totalTransfers"
          [voucherReferenceId]="dialogData.voucherReferenceId"
          class="me-2"
        />
      }

      @if (chipData()) {
        <app-colored-chip
          [label]="chipData()!.chipLabel"
          [variant]="chipData()!.chipVariant"
        />
      }
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellOverviewComponent
  implements TableCellComponent<Activity, ActivityLogTableCellContext>
{
  value = input.required<Activity>();
  context = input.required<ActivityLogTableCellContext>();

  chipData = computed<ChipData | undefined>(() => {
    const { type, attributes } = this.value();

    if (type === ActivityTypeEnum.Transaction) {
      return getChipDataByTransactionStatusEnum(attributes.status);
    }

    if (type === ActivityTypeEnum.StatusChange) {
      return getChipDataByRegistrationStatus(attributes.newValue);
    }

    if (type === ActivityTypeEnum.Message) {
      return getChipDataByTwilioMessageStatus(attributes.status);
    }

    return undefined;
  });

  overview = computed(() => {
    const item = this.value();
    switch (item.type) {
      case ActivityTypeEnum.DataChange:
        return item.attributes.fieldName;
      case ActivityTypeEnum.FinancialServiceProviderChange:
        return item.attributes.newValue;
      case ActivityTypeEnum.Message:
        return MESSAGE_CONTENT_TYPE_LABELS[item.attributes.contentType];
      case ActivityTypeEnum.Note:
        return item.attributes.text;
      case ActivityTypeEnum.StatusChange:
        return;
      case ActivityTypeEnum.Transaction:
        return `${ACTIVITY_LOG_ITEM_TYPE_LABELS[item.type]} #${item.attributes.payment.toString()}`;
    }
  });

  voucherDialogData = computed(() => {
    const item = this.value();
    const referenceId = this.context().referenceId;

    if (!referenceId) {
      return;
    }

    if (
      item.type !== ActivityTypeEnum.Transaction ||
      item.attributes.fsp !==
        FinancialServiceProviderName.intersolveVoucherWhatsapp
    ) {
      return;
    }

    return {
      projectId: this.context().projectId(),
      paymentId: item.attributes.payment,
      totalTransfers: item.attributes.amount,
      voucherReferenceId: referenceId,
    };
  });
}
