import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export class CreateProgramFspConfigurationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  fspId: number;

  @ApiProperty({ example: FinancialServiceProviderConfigurationEnum.username })
  @IsNotEmpty()
  @IsEnum(FinancialServiceProviderConfigurationEnum)
  name: WrapperType<FinancialServiceProviderConfigurationEnum>;

  @ApiProperty({
    example: 'test_account',
    description:
      'Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport) or JSON object (for e.g name=displayName)',
  })
  @IsNotEmpty()
  value: string | string[] | Record<string, string>;
}
