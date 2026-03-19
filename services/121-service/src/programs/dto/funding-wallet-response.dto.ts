import { ApiProperty } from '@nestjs/swagger';

import { IntersolveVisaTokenStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export class FundingWalletResponseDto {
  @ApiProperty({ example: false })
  public readonly blocked: boolean;

  @ApiProperty({ enum: IntersolveVisaTokenStatus })
  public readonly status: WrapperType<IntersolveVisaTokenStatus>;

  @ApiProperty({ example: 1000 })
  public readonly balance: number;

  @ApiProperty({ example: 'holder-id', required: false, nullable: true })
  public readonly holderId?: string;
}
