import { IntersolveVoucherResultCode } from '../enum/intersolve-voucher-result-code.enum';
import { IntersolveVoucherEntity } from '../intersolve-voucher.entity';

export class IntersolveIssueCardResponse {
  public readonly resultCode: IntersolveVoucherResultCode;
  public resultDescription: string;
  public readonly cardId: string;
  public readonly pin: string;
  public readonly balance: number;
  public readonly transactionId: string;
  public refPos?: number;
  public voucher?: IntersolveVoucherEntity;
}
