import { ApiProperty } from '@nestjs/swagger';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class ProgramFinancialServiceProviderConfigurationResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public programId: number;

  @ApiProperty({ enum: FinancialServiceProviders, type: 'enum' })
  public financialServiceProviderName: FinancialServiceProviders;

  @ApiProperty({ example: 'FSP Name', type: 'string' })
  public name: string;

  @ApiProperty({ type: 'object' })
  public label: LocalizedString;

  @ApiProperty({ type: 'object' })
  public financialServiceProvider: FinancialServiceProviderDto;
}
