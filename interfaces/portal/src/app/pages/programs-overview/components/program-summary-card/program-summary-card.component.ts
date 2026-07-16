import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { AppRoutes } from '~/app.routes';
import { CardSummaryMetricsContainerComponent } from '~/components/card-summary-metrics-container/card-summary-metrics-container.component';
import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Program } from '~/domains/program/program.model';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-program-summary-card',
  imports: [
    TranslatableStringPipe,
    CommonModule,
    SkeletonInlineComponent,
    CardWithLinkComponent,
    CardSummaryMetricsContainerComponent,
  ],
  providers: [CurrencyPipe, DecimalPipe],
  templateUrl: './program-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSummaryCardComponent {
  private metricApiService = inject(MetricApiService);
  private programApiService = inject(ProgramApiService);
  private paymentApiService = inject(PaymentApiService);
  private currencyPipe = inject(CurrencyPipe);
  private decimalPipe = inject(DecimalPipe);
  private router = inject(Router);
  private authService = inject(AuthService);

  public readonly id = input.required<number>();

  public readonly duplicate = output<Program>();

  public program = injectQuery(this.programApiService.getProgram(this.id));
  public metrics = injectQuery(() => ({
    ...this.metricApiService.getProgramSummaryMetrics(this.id)(),
    enabled: !!this.program.data()?.id,
  }));
  public payments = injectQuery(() => ({
    ...this.paymentApiService.getPaymentAggregationsSummaries(this.id)(),
    enabled: !!this.program.data()?.id,
  }));
  programLink = (programId: number) => ['/', AppRoutes.program, programId];

  public readonly menuItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        label: $localize`:@@program-card-menu-open:Open`,
        icon: 'pi pi-arrow-right',
        command: () => {
          void this.router.navigate(this.programLink(this.id()));
        },
      },
      {
        label: $localize`:@@program-card-menu-edit:Edit`,
        icon: 'pi pi-pencil',
        command: () => {
          void this.router.navigate([
            '/',
            AppRoutes.program,
            this.id(),
            AppRoutes.programSettings,
          ]);
        },
      },
    ];

    if (this.authService.isOrganizationAdmin) {
      items.push({
        label: $localize`:@@program-card-menu-duplicate:Duplicate`,
        icon: 'pi pi-clone',
        command: () => {
          const program = this.program.data();
          if (program) {
            this.duplicate.emit(program);
          }
        },
      });
    }

    return items;
  });

  public readonly getLastPayment = computed(() => {
    const data = this.payments.data();
    if (!data) {
      return;
    }
    return data.sort((a, b) => (a.paymentId < b.paymentId ? 1 : -1))[0];
  });

  public readonly summaryMetrics = computed(() => {
    if (
      this.metrics.isPending() ||
      this.program.isPending() ||
      !this.metrics.data()
    ) {
      return [];
    }

    return [
      {
        value: this.decimalPipe.transform(this.metrics.data()?.targetedPeople),
        label: $localize`Target registrations`,
      },
      {
        value: this.decimalPipe.transform(this.metrics.data()?.includedPeople),
        label: $localize`Included registrations`,
      },
      {
        value: this.currencyPipe.transform(
          this.metrics.data()?.totalBudget,
          this.program.data()?.currency,
          'symbol-narrow',
          '1.0-0',
        ),
        label: $localize`Budget`,
      },
      {
        value: this.currencyPipe.transform(
          this.metrics.data()?.cashDisbursed,
          this.program.data()?.currency,
          'symbol-narrow',
          '1.0-0',
        ),
        label: $localize`Cash disbursed`,
      },
    ];
  });
}
