import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import { AppRoutes } from '~/app.routes';
import { MetricTileComponent } from '~/components/metric-tile/metric-tile.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { ImportReconciliationDataComponent } from '~/components/page-layout-payment/components/import-reconciliation-data/import-reconciliation-data.component';
import { PaymentMenuComponent } from '~/components/page-layout-payment/components/payment-menu/payment-menu.component';
import { ProjectPaymentChartComponent } from '~/components/page-layout-payment/components/project-payment-chart/project-payment-chart.component';
import { SinglePaymentExportComponent } from '~/components/page-layout-payment/components/single-payment-export/single-payment-export.component';
import { StartPaymentComponent } from '~/components/page-layout-payment/components/start-payment/start-payment.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { PaymentAggregate } from '~/domains/payment/payment.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasFspWithExportFileIntegration } from '~/domains/project/project.helper';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-page-layout-payment',
  imports: [
    PageLayoutComponent,
    CardModule,
    DecimalPipe,
    ButtonModule,
    MetricTileComponent,
    ProjectPaymentChartComponent,
    SkeletonModule,
    SinglePaymentExportComponent,
    ImportReconciliationDataComponent,
    PaymentMenuComponent,
    StartPaymentComponent,
  ],
  templateUrl: './page-layout-payment.component.html',
  styles: ``,
  providers: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutPaymentComponent {
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly rtlHelper = inject(RtlHelperService);
  readonly currencyPipe = inject(CurrencyPipe);
  readonly locale = inject(LOCALE_ID);
  readonly paymentApiService = inject(PaymentApiService);
  readonly projectApiService = inject(ProjectApiService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );
  payment = injectQuery(() => ({
    ...this.paymentApiService.getPayment({
      projectId: this.projectId,
      paymentId: this.paymentId,
    })(),
    // Refetch the data every second if a payment count !== transactions count
    refetchInterval: this.refetchPayment() ? 1000 : undefined,
    success: (data: PaymentAggregate) => {
      if (
        data.success.count + data.failed.count + data.waiting.count ===
        this.transactions.data()?.length
      ) {
        this.refetchPayment.set(false);
      }
    },
  }));
  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));
  transactions = injectQuery(
    this.paymentApiService.getPaymentTransactions({
      projectId: this.projectId,
      paymentId: this.paymentId,
    }),
  );

  readonly refetchPayment = signal(true);

  readonly allPaymentsLink = computed(() => [
    '/',
    AppRoutes.project,
    this.projectId(),
    AppRoutes.projectPayments,
  ]);

  readonly paymentDate = computed(() => {
    if (!this.payments.isSuccess()) {
      return '';
    }

    const date = this.payments
      .data()
      .find(
        (payment) => payment.paymentId === Number(this.paymentId()),
      )?.paymentDate;

    return new DatePipe(this.locale).transform(date, 'short') ?? '';
  });

  readonly paymentTitle = computed(
    () => $localize`Payment` + ' ' + this.paymentDate(),
  );

  readonly totalPaymentAmount = computed(() => {
    if (!this.payment.isSuccess()) {
      return '-';
    }

    const totalTransferValue =
      this.payment.data().failed.transferValue +
      this.payment.data().success.transferValue +
      this.payment.data().waiting.transferValue +
      this.payment.data().created.transferValue;

    return (
      this.currencyPipe.transform(
        totalTransferValue,
        this.project.data()?.currency,
        'symbol-narrow',
        '1.2-2',
      ) ?? '0'
    );
  });

  readonly successfulPaymentsAmount = computed(() => {
    if (!this.payment.isSuccess()) {
      return '-';
    }

    return (
      this.currencyPipe.transform(
        this.payment.data().success.transferValue,
        this.project.data()?.currency,
        'symbol-narrow',
        '1.0-0',
      ) ?? '0'
    );
  });

  readonly hasFspWithExportFileIntegration = computed(() =>
    projectHasFspWithExportFileIntegration(this.project.data()),
  );
}
