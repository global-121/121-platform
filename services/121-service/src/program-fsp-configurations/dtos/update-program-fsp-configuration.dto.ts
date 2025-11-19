import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

export class UpdateProgramFspConfigurationDto {
  @ApiProperty({ example: { en: 'FSP display name' } })
  @IsNotEmpty()
  public readonly label: UILanguageTranslation;

  @IsArray()
  @ValidateNested()
  @IsDefined()
  @IsOptional()
  // The CreateProgramFspConfigurationPropertyDto is used here instead of the update one because properties are first deleted and than created instead of updated
  @Type(() => CreateProgramFspConfigurationPropertyDto)
  public readonly properties?: CreateProgramFspConfigurationPropertyDto[];
}
