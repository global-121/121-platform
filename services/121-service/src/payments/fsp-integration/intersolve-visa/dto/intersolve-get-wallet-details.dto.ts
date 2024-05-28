import {
  IntersolveCreateWalletResponseAssetDto,
  IntersolveCreateWalletResponseBalanceDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import { IntersolveReponseErrorDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-response-error.dto';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import {
  IntersolveVisaCardStatus,
  IntersolveVisaWalletStatus,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { VisaCardActionLink } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-status-mapping.service';
import { WrapperType } from '@121-service/src/wrapper.type';
import { ApiProperty } from '@nestjs/swagger';

export class GetWalletDetailsResponseDto {
  @ApiProperty()
  public tokenCode: string;
  @ApiProperty({ enum: WalletCardStatus121 })
  public status: WrapperType<WalletCardStatus121>;
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
  public intersolveVisaCardStatus: WrapperType<IntersolveVisaCardStatus>;
  @ApiProperty()
  public intersolveVisaWalletStatus: WrapperType<IntersolveVisaWalletStatus>;
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
