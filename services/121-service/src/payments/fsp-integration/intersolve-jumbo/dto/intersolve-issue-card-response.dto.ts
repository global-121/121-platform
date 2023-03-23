import { IntersolveJumboResultCode } from '../enum/intersolve-jumbo-result-code.enum';

export class IntersolveIssueCardResponse {
  public readonly resultCode: IntersolveJumboResultCode;
  public resultDescription: string;
  public readonly cardId: string;
  public readonly pin: string;
  public readonly balance: number;
  public readonly transactionId: string;
  public refPos?: number;
}
