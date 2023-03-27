import { IntersolveJumboResultCode } from '../enum/intersolve-jumbo-result-code.enum';

export class IntersolveCreatePreOrderResponse {
  public readonly RequestResultSucces: string;
  public readonly resultCode: IntersolveJumboResultCode;
  public readonly resultDescription: string;
  public readonly returnId?: string;
}
