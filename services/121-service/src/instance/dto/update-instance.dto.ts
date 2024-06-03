import { LocalizedString } from '@121-service/src/shared/enum/language.enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateInstanceDto {
  @ApiProperty({ example: 'NGO-name' })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({ example: { en: 'NGO display name' } })
  @IsOptional()
  public readonly displayName?: LocalizedString;

  @ApiProperty({
    example: { en: '<about program>' },
  })
  @IsOptional()
  public readonly aboutProgram?: LocalizedString;
}
