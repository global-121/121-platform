import { ApiProperty } from '@nestjs/swagger';

import { FinancialServiceProviders } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/fsps/fsp.dto';
import { ProgramFinancialServiceProviderConfigurationPropertyResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-property-response.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

type FinancialServiceProviderWithoutConfigProps = Omit<
  FinancialServiceProviderDto,
  'configurationProperties' | 'defaultLabel'
>;

export class ProgramFinancialServiceProviderConfigurationResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public readonly programId: number;

  @ApiProperty({ enum: FinancialServiceProviders })
  public financialServiceProviderName: FinancialServiceProviders;

  @ApiProperty({ example: 'FSP Name', type: 'string' })
  public readonly name: string;

  @ApiProperty({ example: { en: 'FSP display name' } })
  public readonly label: LocalizedString;

  /// Can sometimes be undefined if the financial service provider has been removed from the codebase
  @ApiProperty()
  public readonly financialServiceProvider?: FinancialServiceProviderWithoutConfigProps;

  @ApiProperty({
    example: [
      { name: 'password', updated: new Date() },
      { name: 'username', updated: new Date() },
    ],
    type: 'array',
    description: 'Only property names are returned for security reasons',
  })
  public readonly properties: ProgramFinancialServiceProviderConfigurationPropertyResponseDto[];
}
