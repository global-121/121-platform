import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { BreadcrumbsTitleComponent } from '~/components/page-layout/components/breadcrumbs-title/breadcrumbs-title.component';
import { PageLayoutTitleAndActionsComponent } from '~/components/page-layout/components/page-layout-title-and-actions/page-layout-title-and-actions.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasFspWithExportFileIntegration } from '~/domains/project/project.helper';
import { AuthService } from '~/services/auth.service';
import { ExportService } from '~/services/export.service';
import { ToastService } from '~/services/toast.service';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-payment-header',
  standalone: true,
  imports: [
    PageLayoutTitleAndActionsComponent,
    BreadcrumbsTitleComponent,
    ButtonModule,
  ],
  templateUrl: './payment-header.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentHeaderComponent {
  private locale = inject<Locale>(LOCALE_ID);
  readonly authService = inject(AuthService);
  readonly exportService = inject(ExportService);
  readonly paymentApiService = inject(PaymentApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly toastService = inject(ToastService);

  projectId = input.required<number>();
  paymentId = input.required<number>();

  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));
  project = injectQuery(this.projectApiService.getProject(this.projectId));
  paymentInProgress = injectQuery(
    this.paymentApiService.getPaymentStatusByPaymentId(
      this.projectId,
      this.paymentId,
    ),
  );

  paymentDate = computed(() => {
    if (!this.paymentId() || !this.projectId() || this.payments.isPending()) {
      return '';
    }

    const date = this.payments
      .data()
      ?.find(
        (payment) => payment.payment === Number(this.paymentId()),
      )?.paymentDate;

    return new DatePipe(this.locale).transform(date, 'short') ?? '';
  });

  paymentTitle = computed(() => {
    return $localize`Payment` + ' ' + this.paymentDate();
  });

  allPaymentsLink = computed(() => [
    '/',
    AppRoutes.project,
    this.projectId(),
    AppRoutes.projectPayments,
  ]);

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
