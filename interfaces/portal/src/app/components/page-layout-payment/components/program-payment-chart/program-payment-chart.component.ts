import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import tailwindConfig from '~/../../tailwind.config';
import { PaymentAggregationFull } from '~/domains/payment/payment.model';
import { TRANSACTION_STATUS_LABELS } from '~/domains/transaction/transaction.helper';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-program-payment-chart',
  imports: [ChartModule],
  templateUrl: './program-payment-chart.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramPaymentChartComponent {
  readonly paymentDetails = input.required<PaymentAggregationFull>();

  readonly translatableStringService = inject(TranslatableStringService);

  readonly chartData = computed(() => {
    const { approved, waiting, success, failed } = this.paymentDetails();
    const data = {
      labels: [
        TRANSACTION_STATUS_LABELS[TransactionStatusEnum.approved],
        TRANSACTION_STATUS_LABELS[TransactionStatusEnum.waiting],
        TRANSACTION_STATUS_LABELS[TransactionStatusEnum.success],
        TRANSACTION_STATUS_LABELS[TransactionStatusEnum.error],
      ],
      datasets: [
        {
          data: [approved.count, waiting.count, success.count, failed.count],
          backgroundColor: [
            tailwindConfig.theme.colors.purple[500],
            tailwindConfig.theme.colors.blue[500],
            tailwindConfig.theme.colors.green[500],
            tailwindConfig.theme.colors.red[500],
          ],
        },
      ],
    };

    return data satisfies ChartData;
  });

  private readonly total = computed(() => {
    const paymentDetails = this.paymentDetails();

    const { pendingApproval, approved, waiting, success, failed } =
      paymentDetails;

    return (
      pendingApproval.count +
      approved.count +
      waiting.count +
      success.count +
      failed.count
    );
  });

  readonly chartOptions = computed(() => ({
    animation: {
      duration: 0,
    },
    indexAxis: 'y',
    responsive: true,
    borderRadius: 4,
    layout: {
      padding: {
        right: 50,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        align: 'right',
        anchor: 'end',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          crossAlign: 'far',
          padding: 8,
        },
        grid: {
          display: false,
        },
      },
      x: {
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        border: { display: false },
        suggestedMax: this.total(),
      },
    },
  }));

  readonly chartTextAlternative = computed(() => {
    const chartData = this.chartData();
    const metrics = chartData.datasets[0].data;

    return (
      $localize`Payment status chart. ` +
      this.translatableStringService.commaSeparatedList({
        values: chartData.labels.map(
          (label, index) => `${label}: ${String(metrics[index])}`,
        ),
        sortedAlphabetically: false,
      })
    );
  });
}
