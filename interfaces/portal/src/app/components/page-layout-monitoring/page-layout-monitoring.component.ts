import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { MetricTileComponent } from '~/components/metric-tile/metric-tile.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { MonitoringMenuComponent } from '~/components/page-layout-monitoring/components/monitoring-menu/monitoring-menu.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-page-layout-monitoring',
  imports: [
    PageLayoutComponent,
    CurrencyPipe,
    CardModule,
    SkeletonModule,
    MetricTileComponent,
    DecimalPipe,
    DataListComponent,
    SkeletonInlineComponent,
    MonitoringMenuComponent,
  ],
  templateUrl: './page-layout-monitoring.component.html',
  styles: ``,
  providers: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutMonitoringComponent {
  readonly projectId = input.required<string>();

  readonly locale = inject<Locale>(LOCALE_ID);
  readonly metricApiService = inject(MetricApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly paymentApiService = inject(PaymentApiService);
  readonly translatableStringService = inject(TranslatableStringService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  metrics = injectQuery(() => ({
    ...this.metricApiService.getProjectSummaryMetrics(this.projectId)(),
    enabled: !!this.project.data()?.id,
  }));
  payments = injectQuery(() => ({
    ...this.paymentApiService.getPayments(this.projectId)(),
    enabled: !!this.project.data()?.id,
  }));
  latestPayment = injectQuery(() => ({
    ...this.paymentApiService.getPayment({
      projectId: this.projectId,
      paymentId: this.latestPaymentNumber,
    })(),
    enabled: () => !!this.latestPaymentNumber(),
  }));

  readonly remainingBudget = computed(() => {
    const metricsData = this.metrics.data();

    if (!metricsData) {
      return;
    }

    if (!metricsData.totalBudget && metricsData.cashDisbursed) {
      return -metricsData.cashDisbursed;
    }

    if (!metricsData.totalBudget) {
      return;
    }

    return metricsData.totalBudget - metricsData.cashDisbursed;
  });

  readonly latestPaymentNumber = computed(() => {
    if (!this.payments.isSuccess() || this.payments.data().length === 0) {
      return;
    }

    return this.payments.data()[this.payments.data().length - 1].paymentId;
  });

  readonly projectDescription = computed(() =>
    this.translatableStringService.translate(this.project.data()?.description),
  );

  readonly projectDescriptionData = computed(() => {
    const projectData = this.project.data();

    const listData: DataListItem[] = [
      {
        label: $localize`Targeted people`,
        value: projectData?.targetNrRegistrations,
        type: 'number',
      },
      { label: $localize`Location`, value: projectData?.location },
      {
        label: $localize`Start date`,
        value: projectData?.startDate,
        type: 'date',
      },
      {
        label: $localize`End date`,
        value: projectData?.endDate,
        type: 'date',
      },
      {
        label: $localize`FSP(s)`,
        value:
          projectData?.projectFspConfigurations.map((fsp) => fsp.name) ?? [],
        type: 'options',
        options: projectData?.projectFspConfigurations.map((config) => ({
          label: config.label,
          value: config.name,
        })),
      },
      {
        label: $localize`Budget`,
        value: projectData?.budget,
        type: 'currency',
        currencyCode: projectData?.currency,
      },
      {
        label: $localize`Payment frequency`,
        value: projectData?.distributionFrequency,
      },
      {
        label: $localize`Duration`,
        value: projectData?.distributionDuration
          ? $localize`${projectData.distributionDuration}:count: disbursements`
          : undefined,
      },
      {
        label: $localize`Base transfer value`,
        value: projectData?.fixedTransferValue,
        type: 'currency',
        currencyCode: projectData?.currency,
        tooltip: $localize`The base transfer value is multiplied by a set factor for each registration.\n\nFor example, if the base value is $50 and the multiplier is based on household size, a 3-person household would receive $150 per payment.`,
      },
    ];

    return listData.map((item) => ({
      ...item,
      loading: this.project.isPending(),
    }));
  });
}
