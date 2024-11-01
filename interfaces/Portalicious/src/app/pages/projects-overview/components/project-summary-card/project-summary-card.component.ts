import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import { AppRoutes } from '~/app.routes';
import { MetricContainerComponent } from '~/components/metric-container/metric-container.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-project-summary-card',
  standalone: true,
  imports: [
    CardModule,
    SkeletonModule,
    TranslatableStringPipe,
    RouterLink,
    CommonModule,
    CurrencyPipe,
    MetricContainerComponent,
    SkeletonInlineComponent,
  ],
  templateUrl: './project-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSummaryCardComponent {
  private metricApiService = inject(MetricApiService);
  private projectApiService = inject(ProjectApiService);
  private paymentApiService = inject(PaymentApiService);

  public id = input.required<number>();

  public project = injectQuery(this.projectApiService.getProject(this.id));
  public metrics = injectQuery(() => ({
    ...this.metricApiService.getProjectSummaryMetrics(this.id)(),
    enabled: !!this.project.data()?.id,
  }));
  public payments = injectQuery(() => ({
    ...this.paymentApiService.getPayments(this.id)(),
    enabled: !!this.project.data()?.id,
  }));
  projectLink = (projectId: number) => ['/', AppRoutes.project, projectId];

  public getLastPayment = computed(() => {
    const data = this.payments.data();
    if (!data) {
      return;
    }
    return data.sort((a, b) => (a.payment < b.payment ? 1 : -1))[0];
  });
}
