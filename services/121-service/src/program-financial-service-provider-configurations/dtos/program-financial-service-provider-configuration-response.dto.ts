import { ApiProperty } from '@nestjs/swagger';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { ProgramFinancialServiceProviderConfigurationResponsePropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-property-response.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class ProgramFinancialServiceProviderConfigurationResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public readonly programId: number;

  @ApiProperty({ enum: FinancialServiceProviders, type: 'enum' })
  public financialServiceProviderName: FinancialServiceProviders;

  @ApiProperty({ example: 'FSP Name', type: 'string' })
  public readonly name: string;

  @ApiProperty({ type: 'object' })
  public readonly label: LocalizedString;

  /// Can sometimes be undefined if the financial service provider has been removed from the codebase
  @ApiProperty({ type: 'object' })
  public readonly financialServiceProvider?: FinancialServiceProviderDto;

  @ApiProperty({
    example: [
      { name: 'password', updated: new Date() },
      { name: 'username', updated: new Date() },
    ],
    type: 'array',
    description: 'Only property names are returned for security reasons',
  })
  public readonly properties: ProgramFinancialServiceProviderConfigurationResponsePropertyDto[];
}
