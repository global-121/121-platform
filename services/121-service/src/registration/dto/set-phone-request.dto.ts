import {
  Length,
  IsString,
  ValidateIf,
  IsBoolean,
  IsOptional,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { LanguageEnum } from '../../registration/enum/language.enum';

export class SetPhoneRequestDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({ example: '31600000000' })
  @ValidateIf(o => o.phonenumber)
  @IsString()
  public readonly phonenumber: string;
  @ValidateIf(o => o.language)
  @ApiModelProperty({ enum: LanguageEnum, example: LanguageEnum.en })
  @IsEnum(LanguageEnum)
  @Length(2, 8)
  public readonly language: LanguageEnum;
  @ApiModelProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  public readonly useForInvitationMatching: boolean;
}

export class UpdatePhoneRequestDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({ example: '31600000000' })
  @ValidateIf(o => o.phonenumber)
  @IsString()
  public readonly phonenumber: string;
}
