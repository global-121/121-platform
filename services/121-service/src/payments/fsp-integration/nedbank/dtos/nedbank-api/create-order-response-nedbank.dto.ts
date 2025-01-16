import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';

// Named the interface 'CreateOrder' in line with https://apim.nedbank.co.za/static/docs/cashout-create-order
export interface CreateOrderResponseNedbankDto {
  Data: {
    OrderId: string;
    Status: NedbankVoucherStatus;
  };
  Links: {
    Self: string;
  };
  Meta: Record<string, unknown>;
}
