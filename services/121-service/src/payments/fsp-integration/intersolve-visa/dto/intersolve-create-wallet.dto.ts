import { IntersolveQuantityObjectDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-load.dto';

export class IntersolveCreateWalletDto {
  public reference: string;
  public activate = false;
  public quantities: IntersolveQuantityObjectDto[];
}
