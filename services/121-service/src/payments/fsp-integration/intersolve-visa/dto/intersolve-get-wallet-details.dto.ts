import { WalletStatus121 } from '../enum/wallet-status-121.enum';
import { IntersolveVisaWalletStatus } from '../intersolve-visa-wallet.entity';
import {
  IntersolveCreateWalletResponseAssetDto,
  IntersolveCreateWalletResponseBalanceDto,
} from './intersolve-create-wallet-response.dto';
import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

export class GetWalletsResponseDto {
  public wallets: GetWalletDetailsResponseDto[];
}

export class GetWalletDetailsResponseDto {
  public tokenCode: string;
  public status: WalletStatus121;
  public balance: number;
  public issuedDate: Date;
  public lastUsedDate?: Date;
  public activatedDate?: Date;
}

export class IntersolveGetWalletResponseDto {
  public data: IntersolveGetWalletResponseBodyDto;
  public status: number;
  public statusText?: string;
}

export class IntersolveGetWalletResponseBodyDto {
  public success: boolean;
  public errors?: IntersolveReponseErrorDto[];
  public code?: string;
  public correlationId?: string;
  public data: IntersolveGetWalletResponseDataDto;
}

export class IntersolveGetWalletResponseDataDto {
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
