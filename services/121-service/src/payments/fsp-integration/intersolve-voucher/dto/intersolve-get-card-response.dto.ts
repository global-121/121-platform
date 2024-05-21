import { IntersolveVoucherResultCode } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-result-code.enum';

export class IntersolveGetCardResponse {
  public readonly resultCode: IntersolveVoucherResultCode;
  public readonly resultDescription: string;
  public readonly balance: number;
  public readonly balanceFactor: number;
  public readonly status: string;
}
