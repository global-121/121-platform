import { ApiProperty } from '@nestjs/swagger';
import { WalletCardStatus121 } from '../enum/wallet-status-121.enum';
import {
  IntersolveVisaCardStatus,
  IntersolveVisaWalletStatus,
} from '../intersolve-visa-wallet.entity';
import { VisaCardActionLink } from '../services/intersolve-visa-status-mapping.service';
import {
  IntersolveCreateWalletResponseAssetDto,
  IntersolveCreateWalletResponseBalanceDto,
} from './intersolve-create-wallet-response.dto';
import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

export class GetWalletDetailsResponseDto {
  @ApiProperty()
  public tokenCode: string;
  @ApiProperty({ enum: WalletCardStatus121 })
  public status: WalletCardStatus121;
  @ApiProperty()
  public balance: number;
  @ApiProperty()
  public issuedDate: Date;
  @ApiProperty()
  public lastUsedDate?: Date;
  @ApiProperty({ type: [VisaCardActionLink] })
  public links: VisaCardActionLink[];
  @ApiProperty()
  public explanation: string;
  @ApiProperty()
  public spentThisMonth: number;
  @ApiProperty()
  public maxToSpendPerMonth: number;
  @ApiProperty()
  public intersolveVisaCardStatus: IntersolveVisaCardStatus;
  @ApiProperty()
  public intersolveVisaWalletStatus: IntersolveVisaWalletStatus;
}

export class GetWalletsResponseDto {
  @ApiProperty({ type: [GetWalletDetailsResponseDto] })
  public wallets: GetWalletDetailsResponseDto[];
}

export class IntersolveGetWalletResponseDto {
  public data: IntersolveGetWalletResponseBodyDto;
  public status: number;
  public statusText?: string;
}

class IntersolveGetWalletResponseBodyDto {
  public success: boolean;
  public errors?: IntersolveReponseErrorDto[];
  public code?: string;
  public correlationId?: string;
  public data: IntersolveGetWalletResponseDataDto;
}

class IntersolveGetWalletResponseDataDto {
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
