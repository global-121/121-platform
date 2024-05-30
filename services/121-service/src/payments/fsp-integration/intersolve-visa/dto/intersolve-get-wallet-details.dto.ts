import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';
import { IntersolveVisaWalletStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-wallet-status.enum';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { VisaCardActionLink } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-status-mapping.service';
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
  public intersolveVisaCardStatus?: WrapperType<IntersolveVisaCardStatus>;
  @ApiProperty()
  public intersolveVisaWalletStatus?: WrapperType<IntersolveVisaWalletStatus>;
}

export class GetWalletsResponseDto {
  @ApiProperty({ type: [GetWalletDetailsResponseDto] })
  public wallets: GetWalletDetailsResponseDto[];
}
