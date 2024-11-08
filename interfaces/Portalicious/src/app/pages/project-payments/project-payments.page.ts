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

import { CardGridComponent } from '~/components/card-grid/card-grid.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ExportPaymentsComponent } from '~/pages/project-payments/components/export-payments/export-payments.component';
import { PaymentSummaryCardComponent } from '~/pages/project-payments/components/payment-summary-card/payment-summary-card.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-payments',
  standalone: true,
  imports: [
    PageLayoutComponent,
    PaymentSummaryCardComponent,
    ExportPaymentsComponent,
    ButtonModule,
    CardGridComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-payments.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentsPageComponent {
  private paymentApiService = inject(PaymentApiService);

  // this is injected by the router
  projectId = input.required<number>();

  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  onCreatePayment() {
    this.toastService.showToast({
      severity: 'warn',
      detail: 'Functionality not implemented yet',
    });
  }

  canExport = computed(() =>
    this.authService.hasAllPermissions({
      projectId: this.projectId(),
      requiredPermissions: [
        PermissionEnum.RegistrationPersonalEXPORT,
        PermissionEnum.PaymentREAD,
        PermissionEnum.PaymentTransactionREAD,
      ],
    }),
  );

  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));

  paymentsSorted = computed(() =>
    this.payments.data()?.sort((a, b) => b.payment - a.payment),
  );
}
