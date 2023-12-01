import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { LanguageEnum } from '../../../registration/enum/language.enum';
import { Transform } from 'class-transformer';

export class CreateMessageTemplateDto {
  @ApiProperty({
    description: `Some types are use for registration status changes, for example: invite, include, endInclusion, reject and pause. Other values can be used to send custom messages.`,
  })
  @IsString()
  @Length(1, 255)
  public readonly type: string;
  @ApiProperty()
  @IsString()
  @IsEnum(LanguageEnum)
  public readonly language: LanguageEnum;
  @ApiProperty()
  @IsString()
  public readonly message: string;
  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly isWhatsappTemplate: boolean;
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
  public readonly language: LanguageEnum;
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
  public readonly language: LanguageEnum;
}
