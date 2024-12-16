import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';

// Named in line with https://apim.nedbank.co.za/static/docs/cashout-create-order
// I prefixed the names with Nedbank to avoid any confusion with other services (this is convienent with auto-import and finding files with cmd+p)
// ##TODO: Should we either also prefix interfaces in other FSPs integrations or remove the prefix from this one?
export interface NedbankCreateOrderResponseDto {
  Data: {
    OrderId: string;
    Status: NedbankVoucherStatus;
  };
  Links: {
    Self: string;
  };
  Meta: Record<string, unknown>;
}
