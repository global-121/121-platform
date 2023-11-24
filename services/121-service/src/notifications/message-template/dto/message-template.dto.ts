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

export class MessageTemplateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly type: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly language: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly message: string;
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  public readonly isWhatsappTemplate: boolean;
}

export class DeleteTemplateParamDto {
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  public readonly programId: number;
  @IsString()
  @Length(1, 255)
  public readonly messageType: string;
}

export class DeleteTemplateQueryDto {
  @ApiProperty()
  @IsEnum(LanguageEnum)
  language: LanguageEnum;
}
