import { ApiProperty } from '@nestjs/swagger';

import { IntersolveVisaCardDto } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/dtos/internal/intersolve-visa-card.dto';

export class IntersolveVisaWalletDto {
  @ApiProperty()
  public tokenCode: string;
  @ApiProperty()
  public balance: number;
  @ApiProperty()
  public spentThisMonth: number;
  @ApiProperty()
  public maxToSpendPerMonth: number;
  @ApiProperty({ type: Date, nullable: true })
  public lastUsedDate: Date | null;
  @ApiProperty({ type: Date, nullable: true })
  public lastExternalUpdate: string | null;
  @ApiProperty({ type: [IntersolveVisaCardDto] })
  public cards: IntersolveVisaCardDto[];
}
