import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';

import { AppRoutes } from '~/app.routes';
import { Payment } from '~/domains/payment/payment.model';

export const FSPS_WITH_VOUCHER_SUPPORT = [
  Fsps.intersolveVoucherPaper,
  Fsps.intersolveVoucherWhatsapp,
];

export const FSPS_WITH_PHYSICAL_CARD_SUPPORT = [Fsps.intersolveVisa];

export const getNextPaymentId = (payments: Payment[]): number => {
  if (payments.length === 0) {
    return 1;
  }

  return Math.max(...payments.map((payment) => payment.payment)) + 1;
};

export const paymentLink = ({
  projectId,
  paymentId,
}: {
  projectId: number | string;
  paymentId: number | string;
}) => ['/', AppRoutes.project, projectId, AppRoutes.projectPayments, paymentId];
