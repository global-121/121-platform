import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LocalizedString } from 'src/shared/enum/language.enums';

export class UpdateInstanceDto {
  @ApiProperty({ example: 'NGO-name' })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({ example: { en: 'NGO display name' } })
  @IsOptional()
  public readonly displayName: LocalizedString;

  @ApiProperty({
    example: { en: '<about program>' },
  })
  @IsOptional()
  public readonly aboutProgram: LocalizedString;
}
