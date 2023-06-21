import { IntersolveVoucherResultCode } from '../enum/intersolve-voucher-result-code.enum';

export class IntersolveCancelResponse {
  public readonly resultCode: IntersolveVoucherResultCode;
  public readonly resultDescription: string;
}
