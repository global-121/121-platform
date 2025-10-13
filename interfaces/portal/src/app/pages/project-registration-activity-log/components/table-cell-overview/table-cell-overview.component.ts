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
import { RouterLink } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
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
import { FSPS_WITH_VOUCHER_SUPPORT } from '~/domains/payment/payment.helpers';
import {
  REGISTRATION_STATUS_LABELS,
  registrationLink,
} from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';
import { RetryTransfersDialogComponent } from '~/pages/project-payment-transfer-list/components/retry-transfers-dialog/retry-transfers-dialog.component';
import { ActivityLogTransferHistoryDialogComponent } from '~/pages/project-registration-activity-log/components/activity-log-transfer-history-dialog/activity-log-transfer-history-dialog.component';
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
    ActivityLogTransferHistoryDialogComponent,
    NgClass,
    ButtonModule,
    RetryTransfersDialogComponent,
    RouterLink,
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
      return item.attributes.paymentId.toString();
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
      case ActivityTypeEnum.FspChange:
        return this.registrationAttributeService.localizeAttribute({
          attributes: this.registrationAttributes.data(),
          attributeName:
            GenericRegistrationAttributes.programFspConfigurationName,
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
      case ActivityTypeEnum.IgnoredDuplicate:
        return $localize`Duplication ignored with Reg. #${item.attributes.duplicateWithRegistrationProgramId}`;
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

  readonly getVoucherDialogData = computed(() => {
    const item = this.value();
    const referenceId = this.context().referenceId;

    if (!referenceId) {
      return;
    }

    if (
      item.type !== ActivityTypeEnum.Transaction ||
      !FSPS_WITH_VOUCHER_SUPPORT.includes(item.attributes.fspName)
    ) {
      return;
    }

    return {
      projectId: this.context().projectId(),
      paymentId: item.attributes.paymentId,
      totalTransfers: item.attributes.amount,
      voucherReferenceId: referenceId,
    };
  });

  readonly getTransferHistoryDialogData = computed(() => {
    const item = this.value();
    if (item.type !== ActivityTypeEnum.Transaction) {
      return;
    }
    return {
      projectId: this.context().projectId(),
      transactionId: item.attributes.transactionId,
      paymentDate: item.attributes.paymentDate,
    };
  });

  readonly isIgnoreDuplicationType = computed(
    () => this.value().type === ActivityTypeEnum.IgnoredDuplicate,
  );

  readonly duplicateLink = computed(() => {
    const item = this.value();

    if (item.type !== ActivityTypeEnum.IgnoredDuplicate) {
      return;
    }

    return registrationLink({
      projectId: this.context().projectId(),
      registrationId: item.attributes.duplicateWithRegistrationId,
    });
  });

  retryTransfer() {
    const referenceId = this.context().referenceId;
    if (!referenceId) {
      return;
    }
    const referenceIds = [referenceId];
    this.retryTransfersDialog().retryFailedTransfers({
      referenceIds,
    });
  }
}
