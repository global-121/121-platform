import { IntersolveVoucherResultCode } from '../enum/intersolve-voucher-result-code.enum';

export class IntersolveGetCardResponse {
  public readonly resultCode: IntersolveVoucherResultCode;
  public readonly resultDescription: string;
  public readonly balance: number;
  public readonly balanceFactor: number;
  public readonly status: string;
}
