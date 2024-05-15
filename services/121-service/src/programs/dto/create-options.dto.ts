import { LocalizedString } from '@121-service/src/shared/enum/language.enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOptionsDto {
  @ApiProperty()
  @IsString()
  public readonly option: string;

  @ApiProperty()
  @IsNotEmpty()
  public readonly label: LocalizedString;
}
