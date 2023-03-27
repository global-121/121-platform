import { IntersolveJumboResultCode } from '../enum/intersolve-jumbo-result-code.enum';

export class IntersolveCreatePreOrderResponse {
  public readonly RequestResultSucces: { _text: string };
  public readonly resultCode: { _cdata: IntersolveJumboResultCode };
  public readonly resultDescription: { _cdata: string };
  public readonly returnId?: { _cdata: string };
}
