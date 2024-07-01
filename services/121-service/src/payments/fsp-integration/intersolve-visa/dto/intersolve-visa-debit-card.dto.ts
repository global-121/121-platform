import { VisaCardActionLinkDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-action-link.dto';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { WrapperType } from '@121-service/src/wrapper.type';
import { ApiProperty } from '@nestjs/swagger';

export class IntersolveVisaDebitCardDto {
  @ApiProperty({ example: '123456' })
  public tokenCode: string;

  @ApiProperty({
    enum: WalletCardStatus121,
    example: WalletCardStatus121.Issued,
  })
  public status: WrapperType<WalletCardStatus121>;

  @ApiProperty({ example: '2022-01-01T00:00:00Z' })
  public issuedDate: Date;

  @ApiProperty({
    type: [VisaCardActionLinkDto],
  })
  public links: WrapperType<VisaCardActionLinkDto>[];

  @ApiProperty({ example: 'Card issued' })
  public explanation: string;

  @ApiProperty()
  public debugInfo: WrapperType<IntersolveVisaDebitCardDtoDebugInfoDto>;
}

class IntersolveVisaDebitCardDtoDebugInfoDto {
  @ApiProperty({ example: IntersolveVisaCardStatus.CardOk })
  public intersolveVisaCardStatus: WrapperType<IntersolveVisaCardStatus | null>;
  @ApiProperty({ example: IntersolveVisaTokenStatus.Active })
  public intersolveVisaWalletStatus: WrapperType<IntersolveVisaTokenStatus>;
}
