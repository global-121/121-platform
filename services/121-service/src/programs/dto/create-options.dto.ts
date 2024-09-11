import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class CreateOptionsDto {
  @ApiProperty()
  @IsString()
  public readonly option: string;

  @ApiProperty()
  @IsNotEmpty()
  public readonly label: LocalizedString;
}
