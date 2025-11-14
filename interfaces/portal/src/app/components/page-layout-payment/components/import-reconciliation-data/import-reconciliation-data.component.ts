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
  QueryClient,
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
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-import-reconciliation-data',
  imports: [ButtonModule, ImportFileDialogComponent],
  templateUrl: './import-reconciliation-data.component.html',
  providers: [ToastService],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportReconciliationDataComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();

  private queryClient = inject(QueryClient);
  private authService = inject(AuthService);
  private downloadService = inject(DownloadService);
  private metricApiService = inject(MetricApiService);
  private paymentApiService = inject(PaymentApiService);
  private toastService = inject(ToastService);

  readonly dialogVisible = model<boolean>(false);

  readonly canImportReconciliationData = computed(() =>
    this.authService.hasAllPermissions({
      programId: this.programId(),
      requiredPermissions: [
        PermissionEnum.PaymentREAD,
        PermissionEnum.PaymentUPDATE,
        PermissionEnum.PaymentTransactionREAD,
      ],
    }),
  );

  downloadReconciliationTemplatesMutation = injectMutation(() => ({
    mutationFn: () =>
      this.queryClient.fetchQuery(
        this.paymentApiService.getReconciliationDataTemplates(this.programId)(),
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
        programId: this.programId,
        paymentId: this.paymentId,
        file,
      });
    },
    onSuccess: (response) => {
      void this.metricApiService.invalidateCache(this.programId);
      void this.paymentApiService.invalidateCache(
        this.programId,
        this.paymentId,
      );
      this.dialogVisible.set(false);
      this.toastService.showToast({
        detail: $localize`Reconciliation data imported successfully.`,
      });

      if (response.blobResult) {
        this.downloadService.downloadFile({
          file: response.blobResult,
          filename: `import-fsp-reconciliation-response-${new Date().toISOString().substring(0, 10)}`,
        });
      }
    },
  }));

  importReconciliationData() {
    this.dialogVisible.set(true);
  }
}
