import { ApiProperty } from '@nestjs/swagger';

import { Length } from 'class-validator';

export class PhoneNumberDto {
  @ApiProperty({ example: '+15108675310' })
  @Length(8, 17)
  public readonly phoneNumber: string;
}
