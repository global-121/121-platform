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
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { AuthService } from '~/services/auth.service';
import { ExportService } from '~/services/export.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

@Component({
  selector: 'app-single-payment-export',
  imports: [FormDialogComponent, ButtonMenuComponent],
  templateUrl: './single-payment-export.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SinglePaymentExportComponent {
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();
  readonly hasExportFileIntegration = input<boolean>(false);

  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private toastService = inject(ToastService);
  private trackingService = inject(TrackingService);
  private paymentApiService = inject(PaymentApiService);

  readonly exportFspPaymentListDialog = viewChild.required<FormDialogComponent>(
    'exportFspPaymentListDialog',
  );
  readonly paymentReportDialog = viewChild.required<FormDialogComponent>(
    'paymentReportDialog',
  );

  ExportType = ExportType;

  paymentInProgress = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );

  readonly fspPaymentListLabel = computed(
    () => $localize`:@@export-fsp-payment-list:Export FSP payment list`,
  );

  readonly exportFspPaymentListMutationData = computed(() => ({
    paymentId: this.paymentId(),
  }));

  exportFspPaymentListMutation = injectMutation(() =>
    this.exportService.getExportFspInstructionsMutation(
      this.projectId,
      this.toastService,
    ),
  );

  readonly paymentReportLabel = computed(
    () => $localize`:@@payment-report:Payment report`,
  );

  exportByTypeMutation = injectMutation(() =>
    this.exportService.getExportByTypeMutation(
      this.projectId,
      this.toastService,
    ),
  );

  readonly canExportPaymentInstructions = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.PaymentFspInstructionREAD,
    }),
  );

  readonly exportOptions = computed<MenuItem[]>(() => {
    const paymentStatus = this.paymentInProgress.data();
    const paymentInProgress = paymentStatus?.inProgress ?? false;

    return [
      {
        label: this.fspPaymentListLabel(),
        visible:
          this.canExportPaymentInstructions() &&
          this.hasExportFileIntegration(),
        command: () => {
          this.trackingService.trackEvent({
            category: TrackingCategory.export,
            action: TrackingAction.selectDropdownOption,
            name: 'fsp-payment-list',
          });
          if (this.handlePaymentInProgress(paymentInProgress)) {
            return;
          }
          this.exportFspPaymentListDialog().show({
            trackingEvent: {
              category: TrackingCategory.export,
              action: TrackingAction.clickProceedButton,
              name: 'fsp-payment-list',
            },
          });
        },
      },
      {
        label: this.paymentReportLabel(),
        visible: this.authService.hasAllPermissions({
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
            name: 'payment-report',
          });
          if (this.handlePaymentInProgress(paymentInProgress)) {
            return;
          }
          this.paymentReportDialog().show({
            trackingEvent: {
              category: TrackingCategory.export,
              action: TrackingAction.clickProceedButton,
              name: 'payment-report',
            },
          });
        },
      },
    ];
  });

  handlePaymentInProgress(paymentInProgress: boolean): boolean {
    if (paymentInProgress) {
      this.toastService.showToast({
        severity: 'warn',
        summary: $localize`Export not possible`,
        detail: $localize`A payment is currently in progress. Please try again later`,
      });
      return true;
    }
    return false;
  }
}
