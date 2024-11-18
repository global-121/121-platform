import {
  IntersolveCreateWalletResponseAssetDto,
  IntersolveCreateWalletResponseBalanceDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import { IntersolveVisaWalletStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';

export class IntersolveCreateWalletResponseTokenDto {
  public code: string;
  public blocked?: boolean;
  public type?: string;
  public brandTypeCode?: string;
  public status?: IntersolveVisaWalletStatus;
  public balances?: IntersolveCreateWalletResponseBalanceDto[];
  public blockReasonCode?: string;
  public tier?: string;
  public holderId?: string;
  public assets?: IntersolveCreateWalletResponseAssetDto[];
}
