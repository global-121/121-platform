import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { VisaCardActionLink } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-status-mapping.service';
import { WrapperType } from '@121-service/src/wrapper.type';
import { ApiProperty } from '@nestjs/swagger';

export class GetWalletDetailsResponseDto {
  @ApiProperty()
  public tokenCode?: string;
  @ApiProperty({ enum: WalletCardStatus121 })
  public status: WrapperType<WalletCardStatus121>;
  @ApiProperty()
  public balance?: number;
  @ApiProperty()
  public issuedDate: Date;
  @ApiProperty()
  public lastUsedDate?: Date | null;
  @ApiProperty({ type: [VisaCardActionLink] })
  public links: VisaCardActionLink[];
  @ApiProperty()
  public explanation: string;
  @ApiProperty()
  public spentThisMonth: number;
  @ApiProperty()
  public maxToSpendPerMonth: number;
  @ApiProperty()
  public intersolveVisaCardStatus?: WrapperType<IntersolveVisaCardStatus>;
  @ApiProperty()
  public intersolveVisaWalletStatus?: WrapperType<IntersolveVisaTokenStatus>;
}

export class GetWalletsResponseDto {
  @ApiProperty({ type: [GetWalletDetailsResponseDto] })
  public wallets: GetWalletDetailsResponseDto[];
}
