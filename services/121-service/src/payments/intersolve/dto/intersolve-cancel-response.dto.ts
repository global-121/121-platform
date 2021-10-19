import { IntersolveResultCode } from '../enum/intersolve-result-code.enum';

export class IntersolveCancelResponse {
  public readonly resultCode: IntersolveResultCode;
  public readonly resultDescription: string;
}
