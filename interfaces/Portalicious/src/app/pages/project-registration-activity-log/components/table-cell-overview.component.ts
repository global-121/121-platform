import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ChipModule } from 'primeng/chip';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import {
  ChipData,
  getChipDataByTransactionStatusEnum,
  getChipDataByTwilioMessageStatus,
} from '~/components/colored-chip/colored-chip.helper';
import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { MESSAGE_CONTENT_TYPE_LABELS } from '~/domains/message/message.helper';
import { ProjectApiService } from '~/domains/project/project.api.service';
import {
  ACTIVITY_LOG_ITEM_TYPE_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';
import { ActivityLogVoucherDialogComponent } from '~/pages/project-registration-activity-log/components/activity-log-voucher-dialog/activity-log-voucher-dialog.component';
import { ActivityLogTableCellContext } from '~/pages/project-registration-activity-log/project-registration-activity-log.page';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-table-cell-overview',
  standalone: true,
  imports: [
    ChipModule,
    ColoredChipComponent,
    ActivityLogVoucherDialogComponent,
  ],
  template: `
    <div class="flex w-full content-between items-center">
      @if (!!overview()) {
        <span class="">{{ overview() }}</span>
      }

      @if (chipData()) {
        <div class="me-auto ms-2">
          <app-colored-chip
            [label]="chipData()!.chipLabel"
            [variant]="chipData()!.chipVariant"
          />
        </div>
      }

      @let dialogData = voucherDialogData();
      @if (dialogData) {
        <app-activity-log-voucher-dialog
          [projectId]="dialogData.projectId"
          [paymentId]="dialogData.paymentId"
          [totalTransfers]="dialogData.totalTransfers"
          [voucherReferenceId]="dialogData.voucherReferenceId"
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
  readonly projectApiService = inject(ProjectApiService);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  value = input.required<Activity>();
  context = input.required<ActivityLogTableCellContext>();

  projectAttributes = injectQuery(() => ({
    ...this.projectApiService.getProjectAttributes({
      projectId: this.context().projectId,
      includeProgramRegistrationAttributes: true,
      includeTemplateDefaultAttributes: false,
    })(),
    enabled: !!this.context().projectId(),
  }));

  chipData = computed<ChipData | undefined>(() => {
    const { type, attributes } = this.value();

    if (type === ActivityTypeEnum.Transaction) {
      return getChipDataByTransactionStatusEnum(attributes.status);
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
        return this.getLabelByFieldName(item.attributes.fieldName);
      case ActivityTypeEnum.FinancialServiceProviderChange:
        return item.attributes.newValue;
      case ActivityTypeEnum.Message:
        return MESSAGE_CONTENT_TYPE_LABELS[item.attributes.contentType];
      case ActivityTypeEnum.Note:
        return item.attributes.text;
      case ActivityTypeEnum.StatusChange:
        return REGISTRATION_STATUS_LABELS[item.attributes.newValue];
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
      item.attributes.financialServiceProviderName !==
        FinancialServiceProviders.intersolveVoucherWhatsapp
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

  getLabelByFieldName(fieldName: string | undefined): string | undefined {
    if (!this.projectAttributes.isSuccess() || !fieldName) {
      return;
    }
    const matchingAttribute = this.projectAttributes
      .data()
      .find((attribute) => attribute.name === fieldName);
    if (!matchingAttribute) {
      return;
    }
    return this.translatableStringService.translate(matchingAttribute.label);
  }
}
