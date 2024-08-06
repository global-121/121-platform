import { IntersolveVisaCard } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-card';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty()
  public lastExternalUpdate: string; // TODO: This could also be null, right? If no external update has been done yet.
  @ApiProperty({ type: [IntersolveVisaCard] })
  public cards: IntersolveVisaCard[];
}
