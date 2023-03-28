import { IntersolveJumboResultCode } from '../enum/intersolve-jumbo-result-code.enum';

export class IntersolveCreatePreOrderResponse {
  public readonly RequestResultSucces: { _text: string };
  public readonly ResultCode: { _cdata: IntersolveJumboResultCode };
  public readonly ResultDescription: { _cdata: string };
  public readonly ReturnId?: { _cdata: string };
}
