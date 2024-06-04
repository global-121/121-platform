import { LocalizedString } from '@121-service/src//shared/types/localized-string.type';
import { WrapperType } from '@121-service/src//wrapper.type';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';

export class CreateMessageTemplateDto {
  @ApiProperty({
    description: `Some types are use for registration status changes, for example: invite, include, reject and pause. Other values can be used to send custom messages.`,
  })
  @IsString()
  @Length(1, 255)
  public readonly type: string;

  @ApiProperty()
  @IsString()
  @IsEnum(LanguageEnum)
  public readonly language: WrapperType<LanguageEnum>;

  @ApiProperty({
    example: { en: 'Template label' },
  })
  @IsNotEmpty()
  @ValidateIf((o) => o.isSendMessageTemplate)
  public readonly label: LocalizedString;

  @ApiProperty()
  @IsString()
  public readonly message: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly isWhatsappTemplate: boolean;

  @ApiProperty({
    example: false,
    description:
      'Set to true if you want the template to be selectable through Send Message action in portal',
  })
  @IsBoolean()
  public readonly isSendMessageTemplate: boolean;
}

export class UpdateTemplateParamDto {
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  public readonly programId: number;
  @IsString()
  @Length(1, 255)
  public readonly type: string;
  @IsOptional()
  @IsEnum(LanguageEnum)
  public readonly language?: WrapperType<LanguageEnum>;
}

export class UpdateTemplateBodyDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly message?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  public readonly isWhatsappTemplate?: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  public readonly isSendMessageTemplate?: boolean;

  @ApiProperty({
    example: { en: 'Template label' },
  })
  @IsOptional()
  public readonly label?: LocalizedString;
}

export class DeleteTemplateParamDto {
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  public readonly programId: number;
  @IsString()
  @Length(1, 255)
  public readonly type: string;
}

export class DeleteTemplateQueryDto {
  @IsOptional()
  @IsEnum(LanguageEnum)
  public readonly language?: WrapperType<LanguageEnum>;
}
