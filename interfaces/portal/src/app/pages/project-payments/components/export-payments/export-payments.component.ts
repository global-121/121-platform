import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import {
  projectHasPhysicalCardSupport,
  projectHasVoucherSupport,
} from '~/domains/project/project.helper';
import { LatestExportDateComponent } from '~/pages/project-registrations/components/latest-export-date/latest-export-date.component';
import { AuthService } from '~/services/auth.service';
import { DownloadService } from '~/services/download.service';
import { ExportService } from '~/services/export.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

@Component({
  selector: 'app-export-payments',
  imports: [
    ConfirmationDialogComponent,
    ButtonMenuComponent,
    LatestExportDateComponent,
  ],
  providers: [ToastService],
  templateUrl: './export-payments.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPaymentsComponent {
  readonly projectId = input.required<string>();

  private authService = inject(AuthService);
  private downloadService = inject(DownloadService);
  private exportService = inject(ExportService);
  private paymentApiService = inject(PaymentApiService);
  private projectApiService = inject(ProjectApiService);
  private toastService = inject(ToastService);
  private trackingService = inject(TrackingService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));

  readonly exportlastPaymentsDialog =
    viewChild.required<ConfirmationDialogComponent>('exportlastPaymentsDialog');
  readonly exportUnusedVouchersDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'exportUnusedVouchersDialog',
    );
  readonly exportDebitCardUsageDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'exportDebitCardUsageDialog',
    );

  ExportType = ExportType;

  readonly maxLastPaymentsNumber = computed(() => {
    if (!this.payments.isSuccess()) {
      return 0;
    }

    // At max 5 payments can be exported
    return Math.min(this.payments.data().length, 5);
  });

  getMutationData = ({
    type,
    withPaymentRange = false,
  }: {
    type: ExportType;
    withPaymentRange?: boolean;
  }) => {
    const payments = this.payments.data() ?? [];
    const orderedPayments = [...payments].sort((a, b) => a.payment - b.payment);
    const l = payments.length;

    if (!withPaymentRange || l === 0) {
      return { type };
    }

    const minPayment =
      orderedPayments[l - this.maxLastPaymentsNumber()].payment;
    const maxPayment = orderedPayments[l - 1].payment;
    return {
      type,
      minPayment,
      maxPayment,
    };
  };

  readonly lastPaymentsExportLabel = computed(
    () =>
      $localize`:@@export-payments-last:Export last ${this.maxLastPaymentsNumber()} payment(s)`,
  );

  exportPaymentsMutation = injectMutation(() => ({
    mutationFn: this.exportService.getExportListMutation(
      this.projectId,
      this.toastService,
    ),
    onSuccess: ({ exportResult: file, filename }) => {
      this.downloadService.downloadFile({ file, filename });
    },
  }));

  readonly exportOptions = computed<MenuItem[]>(() => [
    {
      label: this.lastPaymentsExportLabel(),
      visible:
        this.maxLastPaymentsNumber() > 0 &&
        this.authService.hasAllPermissions({
          projectId: this.projectId(),
          requiredPermissions: [
            PermissionEnum.PaymentREAD,
            PermissionEnum.PaymentTransactionREAD,
            PermissionEnum.RegistrationPaymentExport,
          ],
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'last-payments',
        });
        this.exportlastPaymentsDialog().askForConfirmation({
          event: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'last-payments',
          },
        });
      },
    },
    {
      label: $localize`:@@export-payments-unused-vouchers:Unused vouchers`,
      visible:
        projectHasVoucherSupport(this.project.data()) &&
        this.maxLastPaymentsNumber() > 0 &&
        this.authService.hasPermission({
          projectId: this.projectId(),
          requiredPermission: PermissionEnum.PaymentVoucherExport,
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'unused-vouchers',
        });
        this.exportUnusedVouchersDialog().askForConfirmation({
          event: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'unused-vouchers',
          },
        });
      },
    },
    {
      label: $localize`:@@export-payments-debit-card-usage:Debit card usage`,
      visible:
        projectHasPhysicalCardSupport(this.project.data()) &&
        this.maxLastPaymentsNumber() > 0 &&
        this.authService.hasPermission({
          projectId: this.projectId(),
          requiredPermission: PermissionEnum.FspDebitCardEXPORT,
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'debit-card-usage',
        });
        this.exportDebitCardUsageDialog().askForConfirmation({
          event: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'debit-card-usage',
          },
        });
      },
    },
  ]);
}
