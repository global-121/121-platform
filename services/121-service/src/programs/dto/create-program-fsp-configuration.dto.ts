import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProgramFspConfigurationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  fspId: number;

  @ApiProperty({ example: FinancialServiceProviderConfigurationEnum.username })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'test_account',
    description:
      'Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport) or JSON object (for e.g name=displayName)',
  })
  @IsNotEmpty()
  value: string | string[] | Record<string, string>;
}
