import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { v4 as uuid } from 'uuid';

import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export class CreateProgramFinancialServiceProviderConfigurationPropertyDto {
  @ApiProperty({
    example: FinancialServiceProviderConfigurationProperties.username,
  })
  @IsNotEmpty()
  @IsEnum(FinancialServiceProviderConfigurationProperties)
  public readonly name: WrapperType<FinancialServiceProviderConfigurationProperties>;

  @ApiProperty({
    example: `password-${uuid()}`,
    description: `Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport)`,
  })
  @IsNotEmpty()
  public readonly value: string | string[];
}
