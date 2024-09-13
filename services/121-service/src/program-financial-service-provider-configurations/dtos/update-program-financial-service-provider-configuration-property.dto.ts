import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProgramFinancialServiceProviderConfigurationPropertyDto {
  @ApiProperty({
    example: FinancialServiceProviderConfigurationEnum.username,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'redcross-user',
    description:
      'Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport)',
  })
  @IsNotEmpty()
  value: string | string[] | Record<string, string>;
}
