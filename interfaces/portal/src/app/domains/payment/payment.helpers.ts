import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';

import { AppRoutes } from '~/app.routes';

export const FSPS_WITH_VOUCHER_SUPPORT = [
  Fsps.intersolveVoucherPaper,
  Fsps.intersolveVoucherWhatsapp,
];

export const FSPS_WITH_PHYSICAL_CARD_SUPPORT = [Fsps.intersolveVisa];

export const paymentLink = ({
  projectId,
  paymentId,
}: {
  projectId: number | string;
  paymentId: number | string;
}) => ['/', AppRoutes.project, projectId, AppRoutes.projectPayments, paymentId];

enum PaymentEventEnum {
  Created = 'created',
  Note = 'note',
}

export const PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS: Record<
  PaymentEventEnum,
  string
> = {
  [PaymentEventEnum.Created]: $localize`:@@payment-event-log-item-type-created:Created`,
  [PaymentEventEnum.Note]: $localize`:@@payment-event-log-item-type-note:Note`,
};

export const PAYMENT_EVENT_LOG_ITEM_TYPE_ICONS: Record<
  PaymentEventEnum,
  string
> = {
  [PaymentEventEnum.Created]: 'pi pi-money-bill',
  [PaymentEventEnum.Note]: 'pi pi-pen-to-square',
};
