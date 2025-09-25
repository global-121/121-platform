import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';

import tailwindConfig from '~/../../tailwind.config';

const colors = tailwindConfig.theme.colors;
export const shade = 500;

export const duplicationColors = {
  [DuplicateStatus.unique]: colors.green[shade],
  [DuplicateStatus.duplicate]: colors.red[shade],
};

export const registrationsByDateColor = colors.blue[shade];

export const paymentColors = {
  [TransactionStatusEnum.error]: colors.red[shade],
  [TransactionStatusEnum.success]: colors.green[shade],
  [TransactionStatusEnum.waiting]: colors.yellow[shade],
};

export const getChartOptions = ({
  title,
  showLegend,
  showDataLabels,
}: {
  title: string;
  showLegend: boolean;
  showDataLabels?: boolean;
}) => ({
  animation: {
    duration: 0,
  },
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: title,
      padding: {
        bottom: 40,
      },
    },
    tooltip: {
      backgroundColor: colors.black.DEFAULT,
    },
    datalabels: {
      display: showDataLabels,
      align: 'end',
      anchor: 'end',
      font: { weight: 'bold' },
    },
    legend: {
      display: showLegend,
      position: 'bottom',
      align: 'center',
      labels: {
        usePointStyle: true,
      },
    },
  },
});
