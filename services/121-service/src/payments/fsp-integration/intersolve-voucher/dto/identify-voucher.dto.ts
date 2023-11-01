import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Length } from 'class-validator';

export class IdentifyVoucherDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(5, 200)
  public readonly referenceId: string;
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  public readonly payment: number;
}
