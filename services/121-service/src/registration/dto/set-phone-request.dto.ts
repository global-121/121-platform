import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { LanguageEnum } from '../../registration/enum/language.enum';

export class SetPhoneRequestDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({ example: '31600000000' })
  @ValidateIf(o => o.phonenumber)
  @IsString()
  public readonly phonenumber: string;
  @ValidateIf(o => o.language)
  @ApiProperty({ enum: LanguageEnum, example: LanguageEnum.en })
  @IsEnum(LanguageEnum)
  @Length(2, 8)
  public readonly language: LanguageEnum;
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  public readonly useForInvitationMatching: boolean;
}

export class UpdatePhoneRequestDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({ example: '31600000000' })
  @ValidateIf(o => o.phonenumber)
  @IsString()
  public readonly phonenumber: string;
}
