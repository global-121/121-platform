import { IntersolveVoucherResultCode } from '@121-service/src/fsp-integrations/api-integrations/intersolve-voucher/enum/intersolve-voucher-result-code.enum';

export class IntersolveCancelTransactionByRefPosResponse {
  public readonly resultCode: IntersolveVoucherResultCode;
  public readonly resultDescription: string;
}
