import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
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
  selector: 'app-single-payment-export',
  imports: [
    ConfirmationDialogComponent,
    ButtonMenuComponent,
    LatestExportDateComponent,
  ],
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
  private downloadService = inject(DownloadService);
  private trackingService = inject(TrackingService);

  readonly exportFspPaymentListDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'exportFspPaymentListDialog',
    );
  readonly paymentReportDialog =
    viewChild.required<ConfirmationDialogComponent>('paymentReportDialog');

  ExportType = ExportType;

  readonly fspPaymentListLabel = computed(
    () => $localize`:@@export-fsp-payment-list:Export FSP payment list`,
  );

  readonly exportFspPaymentListMutationData = computed(() => ({
    paymentId: this.paymentId().toString(),
  }));

  exportFspPaymentListMutation = injectMutation(() => ({
    mutationFn: this.exportService.exportFspInstructions({
      projectId: this.projectId,
      toastService: this.toastService,
    }),
    onSuccess: (filesToExport) => {
      filesToExport.forEach((fileToExport) => {
        void this.downloadService.downloadArrayToXlsx(fileToExport);
      });
    },
  }));

  readonly paymentReportLabel = computed(
    () => $localize`:@@payment-report:Payment report`,
  );

  readonly paymentReportMutationData = computed(() => ({
    type: ExportType.payment,
    minPayment: Number(this.paymentId()),
    maxPayment: Number(this.paymentId()),
  }));

  paymentReportMutation = injectMutation(() => ({
    mutationFn: this.exportService.getExportListMutation(
      this.projectId,
      this.toastService,
    ),
    onSuccess: ({ exportResult: file, filename }) => {
      this.downloadService.downloadFile({ file, filename });
    },
  }));

  readonly canExportPaymentInstructions = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.PaymentFspInstructionREAD,
    }),
  );

  readonly exportOptions = computed<MenuItem[]>(() => [
    {
      label: this.fspPaymentListLabel(),
      visible:
        this.canExportPaymentInstructions() && this.hasExportFileIntegration(),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'fsp-payment-list',
        });
        this.exportFspPaymentListDialog().askForConfirmation({
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
        this.paymentReportDialog().askForConfirmation({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'payment-report',
          },
        });
      },
    },
  ]);
}
