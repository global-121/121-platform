import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProgramFspConfigurationDto {
  @ApiProperty({
    example: FinancialServiceProviderConfigurationEnum.displayName,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: { en: 'FSP display name' },
    description:
      'Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport) or JSON object (for e.g name=displayName)',
  })
  @IsNotEmpty()
  value: string | string[] | Record<string, string>;
}
