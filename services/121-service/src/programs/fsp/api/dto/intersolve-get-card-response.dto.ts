import { IntersolveResultCode } from '../enum/intersolve-result-code.enum';

export class IntersolveGetCardResponse {
  public readonly resultCode: IntersolveResultCode;
  public readonly resultDescription: string;
  public readonly balance: number;
  public readonly balanceFactor: number;
  public readonly status: string;
}
