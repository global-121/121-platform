import { IntersolveResultCode } from '../../../../programs/fsp/api/enum/intersolve-result-code.enum';
import { IntersolveBarcodeEntity } from '../../intersolve-barcode.entity';

export class IntersolveIssueCardResponse {
  public readonly resultCode: IntersolveResultCode;
  public resultDescription: string;
  public readonly cardId: string;
  public readonly pin: string;
  public readonly balance: number;
  public readonly transactionId: string;
  public refPos?: number;
  public voucher?: IntersolveBarcodeEntity;
}
