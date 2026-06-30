import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { v4 as uuid } from 'uuid';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

export class CreateProgramFspConfigurationDto {
  @ApiProperty({ example: 'VisaDebitCards' })
  @IsNotEmpty()
  @IsString()
  public readonly name: string;

  @ApiProperty({
    example: {
      en: 'Visa Debit Cards',
      nl: 'Visa-betaalkaarten',
    },
  })
  @IsNotEmpty()
  public readonly label: UILanguageTranslation;

  @ApiProperty({
    enum: Fsps,
    example: Fsps.intersolveVoucherWhatsapp,
  })
  @IsNotEmpty()
  @IsEnum(Fsps)
  public readonly fspName: Fsps;

  @IsArray()
  @ValidateNested()
  @IsDefined()
  @IsOptional()
  @Type(() => CreateProgramFspConfigurationPropertyDto)
  @ApiProperty({
    example: [
      { name: 'username', value: `username-${uuid()}` },
      { name: 'password', value: `password-${uuid()}` },
    ],
  })
  public readonly properties?: CreateProgramFspConfigurationPropertyDto[];
}
