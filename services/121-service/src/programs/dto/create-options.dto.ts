import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

export class CreateOptionsDto {
  @ApiProperty()
  @IsString()
  public readonly option: string;

  @ApiProperty()
  @IsNotEmpty()
  public readonly label: UILanguageTranslation;
}
