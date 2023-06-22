import { IntersolveQuantityObjectDto } from './intersolve-load.dto';

export class IntersolveCreateWalletDto {
  public reference: string;
  public activate = false;
  public quantities: IntersolveQuantityObjectDto[];
}
