import { NedbankVoucherStatus } from '@121-service/src/fsp-integrations/integrations/nedbank/enums/nedbank-voucher-status.enum';

export interface GetOrderResponseNedbankApiDto {
  Data: {
    OrderId: string;
    Transactions: {
      Voucher: {
        Code: string;
        Status: NedbankVoucherStatus;
        Redeem: {
          Redeemable: boolean;
          Redeemed: boolean;
          RedeemedOn: string;
          RedeemedAt: string;
        };
        Refund: {
          Refundable: boolean;
          Refunded: boolean;
          RefundedOn: string;
        };
        Pin: string;
      };
      PaymentReferenceNumber: string;
      OrderCreateReference: string;
      OrderDateTime: string;
      OrderExpiry: string;
    };
  };
  Links: {
    Self: string;
  };
  Meta: Record<string, unknown>;
}
