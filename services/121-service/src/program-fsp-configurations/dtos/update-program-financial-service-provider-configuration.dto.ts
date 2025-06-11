import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class UpdateProgramFinancialServiceProviderConfigurationDto {
  @ApiProperty({ example: { en: 'FSP display name' } })
  @IsNotEmpty()
  public readonly label: LocalizedString;

  @IsArray()
  @ValidateNested()
  @IsDefined()
  @IsOptional()
  // The CreateProgramFinancialServiceProviderConfigurationPropertyDto is used here instead of the update one because properties are first deleted and than created instead of updated
  @Type(() => CreateProgramFinancialServiceProviderConfigurationPropertyDto)
  public readonly properties?: CreateProgramFinancialServiceProviderConfigurationPropertyDto[];
}
