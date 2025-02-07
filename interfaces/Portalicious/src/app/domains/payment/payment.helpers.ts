import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

import { AppRoutes } from '~/app.routes';
import { Payment } from '~/domains/payment/payment.model';

export const FSPS_WITH_VOUCHER_SUPPORT = [
  FinancialServiceProviders.intersolveVoucherPaper,
  FinancialServiceProviders.intersolveVoucherWhatsapp,
];

export const FSPS_WITH_PHYSICAL_CARD_SUPPORT = [
  FinancialServiceProviders.intersolveVisa,
];

export function getNextPaymentId(payments: Payment[]): number {
  if (payments.length === 0) {
    return 1;
  }

  return Math.max(...payments.map((payment) => payment.payment)) + 1;
}

export const paymentLink = ({
  projectId,
  paymentId,
}: {
  projectId: number | string;
  paymentId: number | string;
}) => ['/', AppRoutes.project, projectId, AppRoutes.projectPayments, paymentId];
