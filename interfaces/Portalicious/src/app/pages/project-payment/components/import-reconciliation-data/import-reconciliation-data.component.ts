import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import {
  ImportFileDialogComponent,
  ImportFileDialogFormGroup,
} from '~/components/import-file-dialog/import-file-dialog.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { AuthService } from '~/services/auth.service';
import { DownloadService } from '~/services/download.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-import-reconciliation-data',
  standalone: true,
  imports: [ButtonModule, ImportFileDialogComponent],
  templateUrl: './import-reconciliation-data.component.html',
  providers: [ToastService],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportReconciliationDataComponent {
  projectId = input.required<string>();
  paymentId = input.required<string>();

  private queryClient = injectQueryClient();
  private authService = inject(AuthService);
  private downloadService = inject(DownloadService);
  private metricApiService = inject(MetricApiService);
  private paymentApiService = inject(PaymentApiService);
  private toastService = inject(ToastService);

  dialogVisible = model<boolean>(false);

  paymentInProgress = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );

  canImportReconciliationData = computed(() =>
    this.authService.hasAllPermissions({
      projectId: this.projectId(),
      requiredPermissions: [
        PermissionEnum.PaymentREAD,
        PermissionEnum.PaymentCREATE,
        PermissionEnum.PaymentTransactionREAD,
      ],
    }),
  );

  importReconciliationData() {
    if (this.paymentInProgress.data()?.inProgress) {
      this.toastService.showToast({
        severity: 'warn',
        summary: $localize`Import not possible`,
        detail: $localize`A payment is currently in progress. Please try again later`,
      });
      return;
    }

    this.dialogVisible.set(true);
  }

  downloadReconciliationTemplatesMutation = injectMutation(() => ({
    mutationFn: () =>
      this.queryClient.fetchQuery(
        this.paymentApiService.getReconciliationDataTemplates(this.projectId)(),
      ),
    onSuccess: (templates) => {
      templates.forEach(({ name, template }) => {
        this.downloadService.downloadStringArrayToCSV({
          file: template,
          filename: `payment-reconciliation-${name}-TEMPLATE`,
        });
      });
    },
  }));

  importReconciliationDataMutation = injectMutation(() => ({
    mutationFn: (
      formValues: ReturnType<ImportFileDialogFormGroup['getRawValue']>,
    ) => {
      const { file } = formValues;

      if (!file) {
        // Should never happen but makes TS happy
        throw new Error('File is required');
      }

      return this.paymentApiService.importReconciliationData({
        projectId: this.projectId,
        paymentId: this.paymentId,
        file,
      });
    },
    onSuccess: (response) => {
      void this.metricApiService.invalidateCache(this.projectId);
      void this.paymentApiService.invalidateCache(
        this.projectId,
        this.paymentId,
      );
      this.dialogVisible.set(false);
      this.toastService.showToast({
        detail: $localize`Reconciliation data imported successfully.`,
      });

      if (response.importResult) {
        this.downloadService.downloadUnknownArrayToCSV({
          file: response.importResult,
          filename: `import-fsp-reconciliation-response-${new Date().toISOString().substring(0, 10)}`,
        });
      }
    },
  }));
}
