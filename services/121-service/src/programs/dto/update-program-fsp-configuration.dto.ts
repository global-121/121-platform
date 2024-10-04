import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export class UpdateProgramFspConfigurationDto {
  @ApiProperty({
    example: FinancialServiceProviderConfigurationEnum.displayName,
  })
  @IsNotEmpty()
  @IsEnum(FinancialServiceProviderConfigurationEnum)
  name: WrapperType<FinancialServiceProviderConfigurationEnum>;

  @ApiProperty({
    example: { en: 'FSP display name' },
    description:
      'Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport) or JSON object (for e.g name=displayName)',
  })
  @IsNotEmpty()
  value: string | string[] | Record<string, string>;
}
