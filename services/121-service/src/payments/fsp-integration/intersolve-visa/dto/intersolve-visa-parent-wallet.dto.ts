import { IntersolveVisaDebitCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-debit-card.dto';
import { ApiProperty } from '@nestjs/swagger';

export class IntersolveVisaParentWalletDto {
  @ApiProperty()
  public balance: number;
  @ApiProperty()
  public lastExternalUpdate: string;
  @ApiProperty()
  public spentThisMonth: number;
  @ApiProperty()
  public maxToSpendPerMonth: number;
  @ApiProperty({ type: Date, nullable: true })
  public lastUsedDate: Date | null;
  @ApiProperty({ type: [IntersolveVisaDebitCardDto] })
  public cards: IntersolveVisaDebitCardDto[];
}
