import { ChartOptions } from 'chart.js';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import tailwindConfig from '~/../../tailwind.config';

const colors = tailwindConfig.theme.colors;
const shade = 100;

export const registrationsPerStatusColors = {
  [RegistrationStatusEnum.included]: colors.green[shade],
  [RegistrationStatusEnum.new]: colors.blue[shade],
  [RegistrationStatusEnum.validated]: colors.yellow[shade],
  [RegistrationStatusEnum.declined]: colors.red[shade],
  [RegistrationStatusEnum.completed]: colors.purple[shade],
  [RegistrationStatusEnum.deleted]: colors.grey[shade],
  [RegistrationStatusEnum.paused]: colors.orange[shade],
};

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
}: {
  title: string;
  showLegend: boolean;
  subtitle?: string;
}): ChartOptions => ({
  animation: {
    duration: 0,
  },
  plugins: {
    title: {
      display: true,
      text: title,
    },
    legend: {
      display: showLegend,
      position: 'top',
      align: 'center',
      labels: {
        usePointStyle: true,
      },
    },
  },
});
