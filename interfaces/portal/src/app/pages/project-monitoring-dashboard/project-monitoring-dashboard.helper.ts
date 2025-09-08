import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import tailwindConfig from '~/../../tailwind.config';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { computed, Signal } from '@angular/core';
import { ChartOptions } from 'chart.js';

const getColor = (color) => tailwindConfig.theme.colors[color][100];

export const registrationsPerStatusColors = {
  [RegistrationStatusEnum.included]: getColor('green'),
  [RegistrationStatusEnum.new]: getColor('blue'),
  [RegistrationStatusEnum.validated]: getColor('yellow'),
  [RegistrationStatusEnum.declined]: getColor('red'),
  [RegistrationStatusEnum.completed]: getColor('purple'),
  [RegistrationStatusEnum.deleted]: getColor('grey'),
  [RegistrationStatusEnum.paused]: getColor('orange'),
};

export const duplicationColors = {
  [DuplicateStatus.unique]: getColor('green'),
  [DuplicateStatus.duplicate]: getColor('red'),
};

export const registrationsByDateColor = getColor('blue');

export const paymentColors = {
  [TransactionStatusEnum.error]: getColor('red'),
  [TransactionStatusEnum.success]: getColor('green'),
  [TransactionStatusEnum.waiting]: getColor('yellow'),
};

export const getLabels = (queryResult) =>
  computed<string[]>(() => {
    if (!queryResult.isSuccess()) {
      return [];
    }

    return Object.keys(queryResult.data()).sort();
  });

export const getData = (queryResult, labels: Signal<string[]>) =>
  computed(() => {
    if (!queryResult.isSuccess() || !labels()) {
      return [];
    }

    const data = queryResult.data();

    return labels().map((k) => data[k]) || [];
  });

export const getChartOptions = ({
  title,
  showLegend = false,
}: {
  title: string;
  showLegend: boolean;
}): ChartOptions => ({
  plugins: {
    title: {
      display: true,
      text: title,
    },
    legend: {
      display: showLegend,
      position: 'top',
      align: 'start',
      labels: {
        usePointStyle: true,
      },
    },
  },
});
