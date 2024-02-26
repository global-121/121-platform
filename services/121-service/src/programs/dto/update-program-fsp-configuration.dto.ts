import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { FinancialServiceProviderConfigurationEnum } from '../../financial-service-providers/enum/financial-service-provider-name.enum';

export class UpdateProgramFspConfigurationDto {
  @ApiProperty({ example: FinancialServiceProviderConfigurationEnum.username })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'test_account',
    description:
      'Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport)',
  })
  @IsNotEmpty()
  value: string;
}
