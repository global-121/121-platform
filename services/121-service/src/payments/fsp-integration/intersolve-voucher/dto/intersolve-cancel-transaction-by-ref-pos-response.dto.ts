import { IntersolveVoucherResultCode } from '../enum/intersolve-voucher-result-code.enum';

export class IntersolveCancelTransactionByRefPosResponse {
  public readonly resultCode: IntersolveVoucherResultCode;
  public readonly resultDescription: string;
}
