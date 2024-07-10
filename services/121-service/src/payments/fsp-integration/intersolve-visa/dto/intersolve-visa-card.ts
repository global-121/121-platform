import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-action.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { WrapperType } from '@121-service/src/wrapper.type';
import { ApiProperty } from '@nestjs/swagger';

// TODO: This class is only included in IntersolveVisaWalletDto, so see if it can be defined in-line there, while still keeping the Mapper function simple. Note: this class does not get the Dto suffix, since it is not a Dto on its own.
export class IntersolveVisaCard {
  @ApiProperty({ example: '123456' })
  public tokenCode: string;

  @ApiProperty({
    enum: VisaCard121Status,
    example: VisaCard121Status.Issued,
  })
  public status: WrapperType<VisaCard121Status>;

  @ApiProperty({ example: 'Card issued' })
  public explanation: string;

  @ApiProperty({ example: '2022-01-01T00:00:00Z' })
  public issuedDate: Date;

  @ApiProperty()
  public actions: WrapperType<VisaCardAction[]>;

  @ApiProperty()
  public debugInformation: WrapperType<IntersolveVisaCardDebugInformation>;
}

// TODO: REFACTOR: Put this in-line in the class above.
class IntersolveVisaCardDebugInformation {
  @ApiProperty({ example: IntersolveVisaCardStatus.CardOk })
  public intersolveVisaCardStatus: WrapperType<IntersolveVisaCardStatus | null>;
  @ApiProperty({ example: IntersolveVisaTokenStatus.Active })
  public intersolveVisaTokenStatus: WrapperType<IntersolveVisaTokenStatus>;
  @ApiProperty({ example: true })
  public isTokenBlocked: boolean;
}
