import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardGridComponent } from '~/components/card-grid/card-grid.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { TopPageBannerComponent } from '~/components/top-page-banner/top-page-banner.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { CreatePaymentComponent } from '~/pages/project-payments/components/create-payment/create-payment.component';
import { ExportPaymentsComponent } from '~/pages/project-payments/components/export-payments/export-payments.component';
import { PaymentSummaryCardComponent } from '~/pages/project-payments/components/payment-summary-card/payment-summary-card.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-project-payments',
  imports: [
    PageLayoutComponent,
    PaymentSummaryCardComponent,
    ExportPaymentsComponent,
    CardGridComponent,
    CreatePaymentComponent,
    TopPageBannerComponent,
  ],
  templateUrl: './project-payments.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentsPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();

  private authService = inject(AuthService);
  private paymentApiService = inject(PaymentApiService);

  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));

  readonly paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );

  readonly paymentsSorted = computed(() =>
    this.payments.data()?.sort((a, b) => b.paymentId - a.paymentId),
  );

  readonly canExport = computed(() =>
    this.authService.hasAllPermissions({
      projectId: this.projectId(),
      requiredPermissions: [
        PermissionEnum.RegistrationPersonalEXPORT,
        PermissionEnum.PaymentREAD,
        PermissionEnum.PaymentTransactionREAD,
      ],
    }),
  );

  readonly canCreatePayment = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.PaymentCREATE,
    }),
  );
}
