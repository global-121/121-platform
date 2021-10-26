import { IntersolveResultCode } from '../enum/intersolve-result-code.enum';

export class IntersolveCancelTransactionByRefPosResponse {
  public readonly resultCode: IntersolveResultCode;
  public readonly resultDescription: string;
}
