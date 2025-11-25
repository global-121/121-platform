import { IntersolveVoucherResultCode } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-result-code.enum';

export interface IntersolveGetCardSoapResponse {
  GetCardResponse?: {
    ResultCode?: { _text: IntersolveVoucherResultCode };
    ResultDescription?: { _text: string };
    Card?: {
      Status?: { _text: string };
      Balance?: { _text: string };
      BalanceFactor?: { _text: string };
    };
  };
}
