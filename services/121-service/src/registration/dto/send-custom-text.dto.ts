import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendCustomTextDto {
  @ApiProperty({
    example: 'Your voucher can be picked up at the location',
  })
  @IsString()
  public readonly message: string;
}
