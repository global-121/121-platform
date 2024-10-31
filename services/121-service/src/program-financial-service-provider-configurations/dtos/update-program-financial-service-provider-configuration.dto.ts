import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class UpdateProgramFinancialServiceProviderConfigurationDto {
  @ApiProperty({ example: { en: 'FSP display name' } })
  @IsNotEmpty()
  public readonly label: LocalizedString;

  @IsArray()
  @ValidateNested()
  @IsDefined()
  @IsOptional()
  @Type(() => CreateProgramFinancialServiceProviderConfigurationPropertyDto)
  public readonly properties?: CreateProgramFinancialServiceProviderConfigurationPropertyDto[];
}
