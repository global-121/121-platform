import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';

export interface NedbankCreateOrderReturn {
  orderCreateReference: string;
  nedbankVoucherStatus: NedbankVoucherStatus;
}
