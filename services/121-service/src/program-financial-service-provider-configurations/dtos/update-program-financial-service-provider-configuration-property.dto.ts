import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

// ##TODO: This class is not used anywhere but should be used when we implement the  program financial service provider configuration property endpoint
export class UpdateProgramFinancialServiceProviderConfigurationPropertyDto {
  @ApiProperty({
    example: 'redcross-user',
    description:
      'Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport)',
  })
  @IsNotEmpty()
  value: string | string[];
}
