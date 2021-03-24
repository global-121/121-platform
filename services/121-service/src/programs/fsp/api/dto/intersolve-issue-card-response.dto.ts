import { IntersolveResultCode } from '../../../../programs/fsp/api/enum/intersolve-result-code.enum';

export class IntersolveIssueCardResponse {
  public readonly resultCode: IntersolveResultCode;
  public readonly resultDescription: string;
  public readonly cardId: string;
  public readonly pin: string;
  public readonly balance: number;
  public readonly transactionId: string;
  public refPos?: number;
}
