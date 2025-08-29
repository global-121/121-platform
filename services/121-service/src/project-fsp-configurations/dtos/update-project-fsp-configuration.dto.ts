import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { CreateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration-property.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class UpdateProjectFspConfigurationDto {
  @ApiProperty({ example: { en: 'FSP display name' } })
  @IsNotEmpty()
  public readonly label: LocalizedString;

  @IsArray()
  @ValidateNested()
  @IsDefined()
  @IsOptional()
  // The CreateProjectFspConfigurationPropertyDto is used here instead of the update one because properties are first deleted and than created instead of updated
  @Type(() => CreateProjectFspConfigurationPropertyDto)
  public readonly properties?: CreateProjectFspConfigurationPropertyDto[];
}
