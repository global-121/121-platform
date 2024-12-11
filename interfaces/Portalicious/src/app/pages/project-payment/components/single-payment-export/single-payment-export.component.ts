import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewChild,
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
import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasFspWithExportFileIntegration } from '~/domains/project/project.helper';
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

  private projectApiService = inject(ProjectApiService);
  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private toastService = inject(ToastService);
  private downloadService = inject(DownloadService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  @ViewChild('exportFspPaymentListDialog')
  private exportFspPaymentListDialog: ConfirmationDialogComponent;
  @ViewChild('paymentReportDialog')
  private paymentReportDialog: ConfirmationDialogComponent;

  ExportType = ExportType;

  fspPaymentListLabel = computed(() => {
    return $localize`:@@export-fsp-payment-list:Export FSP payment list`;
  });
  exportFspPaymentListMutation = injectMutation(() => ({
    mutationFn: this.exportService.exportFspInstructions({
      projectId: this.projectId,
      paymentId: this.paymentId().toString(),
      toastService: this.toastService,
    }),
    onSuccess: ({ data, fileName }) => {
      this.exportService.downloadArrayToXlsx()({
        data,
        fileName,
      });
    },
  }));

  paymentReportMutationData = computed(() => ({
    type: ExportType.payment,
    minPayment: this.paymentId(),
    maxPayment: this.paymentId(),
  }));

  paymentReportLabel = computed(() => {
    return $localize`:@@payment-report:Payment report`;
  });
  paymentReportMutation = injectMutation(() => ({
    mutationFn: this.exportService.getExportListMutation(
      this.projectId,
      this.toastService,
    ),
    onSuccess: ({ exportResult: file, filename }) => {
      this.downloadService.downloadFile({ file, filename });
    },
  }));

  exportOptions = computed<MenuItem[]>(() => [
    {
      label: this.fspPaymentListLabel(),
      visible:
        projectHasFspWithExportFileIntegration(this.project.data()) &&
        this.authService.hasPermission({
          projectId: this.projectId(),
          requiredPermission: PermissionEnum.PaymentFspInstructionREAD,
        }),
      command: () => {
        this.exportFspPaymentListDialog.askForConfirmation();
      },
    },
    {
      label: this.paymentReportLabel(),
      visible: true,
      command: () => {
        this.paymentReportDialog.askForConfirmation();
      },
    },
  ]);
}
