import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';

import { AppRoutes } from '~/app.routes';

export const FSPS_WITH_VOUCHER_SUPPORT = [
  Fsps.intersolveVoucherPaper,
  Fsps.intersolveVoucherWhatsapp,
];

export const FSPS_WITH_PHYSICAL_CARD_SUPPORT = [Fsps.intersolveVisa];

export const paymentLink = ({
  programId,
  paymentId,
}: {
  programId: number | string;
  paymentId: number | string;
}) => ['/', AppRoutes.program, programId, AppRoutes.programPayments, paymentId];

export const PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS: Record<PaymentEvent, string> =
  {
    [PaymentEvent.created]: $localize`:@@payment-event-log-item-type-created:Created`,
    [PaymentEvent.approved]: $localize`:@@payment-event-log-item-type-approved:Approved`,
    [PaymentEvent.started]: $localize`:@@payment-event-log-item-type-started:Started`,
    [PaymentEvent.retry]: $localize`:@@payment-event-log-item-type-retry:Retry`,
    [PaymentEvent.note]: $localize`:@@payment-event-log-item-type-note:Note`,
  };

export const PAYMENT_EVENT_LOG_ITEM_TYPE_ICONS: Record<PaymentEvent, string> = {
  [PaymentEvent.created]: 'pi pi-money-bill',
  [PaymentEvent.approved]: 'pi pi-check-circle',
  [PaymentEvent.started]: 'pi pi-send',
  [PaymentEvent.retry]: 'pi pi-refresh',
  [PaymentEvent.note]: 'pi pi-pen-to-square',
};
