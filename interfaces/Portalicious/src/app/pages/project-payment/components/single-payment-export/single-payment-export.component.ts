import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewChild,
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

@Component({
  selector: 'app-single-payment-export',
  standalone: true,
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
  projectId = input.required<number>();
  paymentId = input.required<number>();

  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private toastService = inject(ToastService);
  private downloadService = inject(DownloadService);

  @ViewChild('exportFspPaymentListDialog')
  private exportFspPaymentListDialog: ConfirmationDialogComponent;
  @ViewChild('paymentReportDialog')
  private paymentReportDialog: ConfirmationDialogComponent;

  ExportType = ExportType;

  fspPaymentListLabel = computed(() => {
    return $localize`:@@export-fsp-payment-list:Export FSP payment list`;
  });
  exportFspPaymentListMutationData = computed(() => ({
    paymentId: this.paymentId().toString(),
  }));
  exportFspPaymentListMutation = injectMutation(() => ({
    mutationFn: this.exportService.exportFspInstructions({
      projectId: this.projectId,
      toastService: this.toastService,
    }),
    onSuccess: (filesToExport) => {
      filesToExport.forEach((fileToExport) => {
        this.exportService.downloadArrayToXlsx()(fileToExport);
      });
    },
  }));

  paymentReportLabel = computed(() => {
    return $localize`:@@payment-report:Payment report`;
  });
  paymentReportMutationData = computed(() => ({
    type: ExportType.payment,
    minPayment: this.paymentId(),
    maxPayment: this.paymentId(),
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

  canExportPaymentInstructions = computed(() => {
    return this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.PaymentFspInstructionREAD,
    });
  });

  exportOptions = computed<MenuItem[]>(() => [
    {
      label: this.fspPaymentListLabel(),
      visible: this.canExportPaymentInstructions(),
      command: () => {
        this.exportFspPaymentListDialog.askForConfirmation();
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
        this.paymentReportDialog.askForConfirmation();
      },
    },
  ]);
}
