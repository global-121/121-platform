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

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectMetricContainerComponent } from '~/pages/projects-overview/components/project-metric-container/project-metric-container.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-payment-summary-card',
  standalone: true,
  imports: [
    CardModule,
    SkeletonModule,
    TranslatableStringPipe,
    RouterLink,
    CommonModule,
    CurrencyPipe,
    ProjectMetricContainerComponent,
    SkeletonInlineComponent,
    ColoredChipComponent,
  ],
  templateUrl: './payment-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSummaryCardComponent {
  private paymentApiService = inject(PaymentApiService);

  public projectId = input.required<number>();
  public paymentId = input.required<number>();
  public cardIndex = input.required<number>();
  public paymentInProgress = input.required<boolean>();

  public metrics = injectQuery(() => ({
    ...this.paymentApiService.getPayment(this.projectId, this.paymentId)(),
    enabled: !!this.projectId() && !!this.paymentId(),
  }));

  public includedRegistrations = computed(() => {
    const successCount = this.metrics.data()?.success.count ?? 0;
    const waitingCount = this.metrics.data()?.waiting.count ?? 0;
    const failedCount = this.metrics.data()?.failed.count ?? 0;

    return successCount + waitingCount + failedCount;
  });

  public totalAmount = computed(() => {
    const successAmount = this.metrics.data()?.success.amount ?? 0;
    const waitingAmount = this.metrics.data()?.waiting.amount ?? 0;
    const failedAmount = this.metrics.data()?.failed.amount ?? 0;

    return successAmount + waitingAmount + failedAmount;
  });

  // paymentLink = (projectId: number) => ['/', AppRoutes.project, projectId];
}
