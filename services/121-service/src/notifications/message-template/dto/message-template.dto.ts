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

import { LocalizedString } from '@121-service/src//shared/types/localized-string.type';
import { WrapperType } from '@121-service/src//wrapper.type';
import { ContentSidMessageTypes } from '@121-service/src/notifications/message-template/const/content-sid-message-types.const';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

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

  @ApiProperty({
    example: 'Hello {{fullName}}, welcome to 121!',
    description: `Message content with optional placeholders. REQUIRED for regular message types.
    NOT ALLOWED for content template types (${ContentSidMessageTypes.join(', ')}).`,
  })
  @IsString()
  @IsOptional()
  public readonly message?: string;

  @ApiProperty({
    example: 'HX1234567890',
    description: `SID of the content template from Twilio console. REQUIRED for content template types (${ContentSidMessageTypes.join(', ')}).
    NOT ALLOWED for regular message types. See https://console.twilio.com/us1/develop/sms/content-template-builder/`,
  })
  @IsString()
  @IsOptional()
  public readonly contentSid?: string;

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
  @IsEnum(LanguageEnum)
  public readonly language: WrapperType<LanguageEnum>;
}

export class UpdateTemplateBodyDto {
  @ApiProperty({
    example: 'Hello {{fullName}}, welcome to 121!',
    description: `Message content with optional placeholders. Required for regular message types.
    Not allowed for content template types (${ContentSidMessageTypes.join(', ')}).`,
  })
  @IsString()
  @IsOptional()
  public readonly message?: string;

  @ApiProperty({
    example: 'HX1234567890',
    description: `SID of the content template from Twilio console. Required for content template types (${ContentSidMessageTypes.join(', ')}).
    Not allowed for regular message types. See https://console.twilio.com/us1/develop/sms/content-template-builder/`,
  })
  @IsString()
  @IsOptional()
  public readonly contentSid?: string;

  @ApiProperty({
    example: false,
    description:
      'Set to true if you want the template to be selectable through Send Message action in portal',
  })
  @IsBoolean()
  @IsOptional()
  public readonly isSendMessageTemplate?: boolean;

  @ApiProperty({
    example: { en: 'Template label' },
    description: 'Localized label for the template',
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
