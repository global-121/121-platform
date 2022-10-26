import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Length } from 'class-validator';

export class IdentifyVoucherDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly payment: number;
}
