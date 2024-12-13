import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasFspWithExportFileIntegration } from '~/domains/project/project.helper';
import { AuthService } from '~/services/auth.service';
import { ExportService } from '~/services/export.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-export-payment-instructions',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './export-payment-instructions.component.html',

  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPaymentInstructionsComponent {
  readonly authService = inject(AuthService);
  readonly exportService = inject(ExportService);
  readonly paymentApiService = inject(PaymentApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly toastService = inject(ToastService);

  projectId = input.required<number>();
  paymentId = input.required<number>();

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  paymentInProgress = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );

  canExportPaymentInstructions = computed(() => {
    return (
      projectHasFspWithExportFileIntegration(this.project.data()) &&
      this.authService.hasPermission({
        projectId: this.projectId(),
        requiredPermission: PermissionEnum.PaymentFspInstructionREAD,
      })
    );
  });

  exportFspInstructions() {
    if (this.paymentInProgress.data()?.inProgress) {
      this.toastService.showToast({
        severity: 'warn',
        summary: $localize`Export not possible`,
        detail: $localize`The current payment is still in progress. Please try again later`,
      });
      return;
    }

    void this.exportService.exportFspInstructions({
      projectId: this.projectId,
      paymentId: this.paymentId().toString(),
      toastService: this.toastService,
    });
  }
}
