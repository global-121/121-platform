import { IntersolveResultCode } from '../../../payments/intersolve/enum/intersolve-result-code.enum';

export class IntersolveCancelTransactionByRefPosResponse {
  public readonly resultCode: IntersolveResultCode;
  public readonly resultDescription: string;
}
