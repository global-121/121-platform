import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { MetricTileComponent } from '~/pages/project/project-monitoring/metric-tile/metric-tile.component';
import { DashboardIframeComponent } from '~/pages/project/project-monitoring/monitoring-iframe/monitoring-iframe.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-project-monitoring',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CurrencyPipe,
    CardModule,
    TranslatableStringPipe,
    SkeletonModule,
    InfoTooltipComponent,
    MetricTileComponent,
    DashboardIframeComponent,
    DecimalPipe,
    DataListComponent,
    SkeletonInlineComponent,
  ],
  templateUrl: './project-monitoring.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMonitoringComponent {
  // this is injected by the router
  projectId = input.required<number>();

  readonly locale = inject(LOCALE_ID);
  readonly projectApiService = inject(ProjectApiService);
  readonly paymentApiService = inject(PaymentApiService);
  readonly translatableStringService = inject(TranslatableStringService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  metrics = injectQuery(() => ({
    ...this.projectApiService.getProjectSummaryMetrics(this.projectId)(),
    enabled: !!this.project.data()?.id,
  }));
  payments = injectQuery(() => ({
    ...this.paymentApiService.getPayments(this.projectId)(),
    enabled: !!this.project.data()?.id,
  }));

  remainingBudget = computed(() => {
    const metricsData = this.metrics.data();

    if (!metricsData) {
      return;
    }

    if (!metricsData.totalBudget && metricsData.spentMoney) {
      return -metricsData.spentMoney;
    }

    if (!metricsData.totalBudget) {
      return;
    }

    return metricsData.totalBudget - metricsData.spentMoney;
  });

  projectDescription = computed(() =>
    this.translatableStringService.translate(this.project.data()?.description),
  );

  projectDescriptionData = computed(() => {
    const projectData = this.project.data();

    const listData: DataListItem[] = [
      {
        label: $localize`Targeted people`,
        value: projectData?.targetNrRegistrations,
        type: 'number',
      },
      {
        label: $localize`Start date`,
        value: projectData?.startDate,
        type: 'date',
      },
      { label: $localize`Location`, value: projectData?.location },
      {
        label: $localize`End date`,
        value: projectData?.endDate,
        type: 'date',
      },
      {
        label: $localize`FSP(s)`,
        value: projectData?.financialServiceProviders
          .map((fsp) =>
            this.translatableStringService.translate(fsp.displayName),
          )
          .join(', '),
      },
      {
        label: $localize`Payment frequency`,
        value: projectData?.distributionFrequency,
      },
      {
        label: $localize`Budget`,
        value: projectData?.budget,
        type: 'currency',
        currencyCode: projectData?.currency,
      },
      {
        label: $localize`Duration`,
        value:
          projectData?.distributionDuration &&
          $localize`${projectData.distributionDuration} disbursements`,
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
