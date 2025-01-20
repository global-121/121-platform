import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import { PaymentAggregate } from '~/domains/payment/payment.model';
import { TRANSACTION_STATUS_LABELS } from '~/domains/transaction/transaction.helper';
import { getTailwindConfig } from '~/utils/tailwind';

const tailwindConfig = getTailwindConfig();

@Component({
  selector: 'app-project-payment-chart',
  imports: [ChartModule],
  templateUrl: './project-payment-chart.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentChartComponent {
  paymentDetails = input.required<PaymentAggregate>();

  chartData = computed(() => {
    const { waiting, success, failed } = this.paymentDetails();
    const data = {
      labels: [
        TRANSACTION_STATUS_LABELS[TransactionStatusEnum.waiting],
        TRANSACTION_STATUS_LABELS[TransactionStatusEnum.success],
        TRANSACTION_STATUS_LABELS[TransactionStatusEnum.error],
      ],
      datasets: [
        {
          data: [waiting.count, success.count, failed.count],
          backgroundColor: [
            tailwindConfig.theme.colors.blue[500],
            tailwindConfig.theme.colors.green[500],
            tailwindConfig.theme.colors.red[500],
          ],
        },
      ],
    };

    return data satisfies ChartData;
  });

  chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
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
      },
    },
  };

  chartAriaLabel = computed(() => {
    const chartData = this.chartData();
    const metrics = chartData.datasets[0].data;

    return (
      $localize`Payment status chart. ` +
      chartData.labels
        .map((label, index) => {
          return `${label}: ${String(metrics[index])}`;
        })
        .join(', ')
    );
  });
}
