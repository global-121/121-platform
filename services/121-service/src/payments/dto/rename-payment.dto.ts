import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class RenamePaymentDto {
  @ApiProperty({ example: 'New payment name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(60)
  public readonly name: string;
}
