import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class BlockUnblockWalletDto {
  @ApiProperty()
  @IsBoolean()
  public blockWallet: boolean;
}
