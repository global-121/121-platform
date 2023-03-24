import { IntersolveJumboResultCode } from '../enum/intersolve-jumbo-result-code.enum';

export class IntersolveGetCardResponse {
  public readonly resultCode: IntersolveJumboResultCode;
  public readonly resultDescription: string;
  public readonly balance: number;
  public readonly balanceFactor: number;
  public readonly status: string;
}
