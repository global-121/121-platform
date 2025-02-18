import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  viewChild,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import {
  ChipData,
  getChipDataByTransactionStatus,
  getChipDataByTwilioMessageStatus,
} from '~/components/colored-chip/colored-chip.helper';
import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { MESSAGE_CONTENT_TYPE_LABELS } from '~/domains/message/message.helper';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';
import { RetryTransfersDialogComponent } from '~/pages/project-payment/components/retry-transfers-dialog/retry-transfers-dialog.component';
import { ActivityLogVoucherDialogComponent } from '~/pages/project-registration-activity-log/components/activity-log-voucher-dialog/activity-log-voucher-dialog.component';
import { ActivityLogTableCellContext } from '~/pages/project-registration-activity-log/project-registration-activity-log.page';
import { AuthService } from '~/services/auth.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-table-cell-overview',
  imports: [
    ChipModule,
    ColoredChipComponent,
    ActivityLogVoucherDialogComponent,
    NgClass,
    ButtonModule,
    RetryTransfersDialogComponent,
  ],
  templateUrl: './table-cell-overview.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellOverviewComponent
  implements TableCellComponent<Activity, ActivityLogTableCellContext>
{
  readonly value = input.required<Activity>();
  readonly context = input.required<ActivityLogTableCellContext>();
  locale = inject<Locale>(LOCALE_ID);

  readonly retryTransfersDialog =
    viewChild.required<RetryTransfersDialogComponent>('retryTransfersDialog');

  readonly registrationAttributeService = inject(RegistrationAttributeService);
  readonly authService = inject(AuthService);

  readonly registrationAttributes = injectQuery(
    this.registrationAttributeService.getRegistrationAttributes(this.context),
  );

  readonly chipData = computed<ChipData | undefined>(() => {
    const { type, attributes } = this.value();

    if (type === ActivityTypeEnum.Transaction) {
      return getChipDataByTransactionStatus(attributes.status);
    }

    if (type === ActivityTypeEnum.Message) {
      return getChipDataByTwilioMessageStatus(attributes.status);
    }

    return undefined;
  });

  readonly paymentId = computed(() => {
    const item = this.value();
    if (item.type === ActivityTypeEnum.Transaction) {
      return item.attributes.payment.toString();
    }
    return undefined;
  });

  readonly overview = computed(() => {
    const item = this.value();
    switch (item.type) {
      case ActivityTypeEnum.DataChange:
        return this.registrationAttributeService.localizeAttribute({
          attributes: this.registrationAttributes.data(),
          attributeName: item.attributes.fieldName,
        });
      case ActivityTypeEnum.FinancialServiceProviderChange:
        return this.registrationAttributeService.localizeAttribute({
          attributes: this.registrationAttributes.data(),
          attributeName:
            GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName,
          attributeOptionValue: item.attributes.newValue,
        });
      case ActivityTypeEnum.Message:
        return MESSAGE_CONTENT_TYPE_LABELS[item.attributes.contentType];
      case ActivityTypeEnum.Note:
        return item.attributes.text;
      case ActivityTypeEnum.StatusChange:
        return REGISTRATION_STATUS_LABELS[item.attributes.newValue];
      case ActivityTypeEnum.Transaction:
        return;
    }
  });

  readonly canRetryTransfer = computed(() => {
    const item = this.value();
    if (
      !this.authService.hasAllPermissions({
        projectId: this.context().projectId(),
        requiredPermissions: [
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentTransactionREAD,
        ],
      })
    ) {
      return false;
    }

    if (item.type !== ActivityTypeEnum.Transaction) {
      return false;
    }
    return item.attributes.status === TransactionStatusEnum.error;
  });

  readonly voucherDialogData = computed(() => {
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

  retryTransfer() {
    // TODO AB#33349: Not sure if this still needs to be checked
    // if (this.paymentStatus.data()?.inProgress) {
    //   this.toastService.showToast({
    //     severity: 'warn',
    //     detail: $localize`A payment is currently in progress. Please wait until it has finished.`,
    //   });
    //   return;
    // }
    const referenceId = this.context().referenceId;
    if (referenceId) {
      const referenceIds = [referenceId];
      this.retryTransfersDialog().retryFailedTransfers({
        referenceIds,
      });
    }
  }
}
