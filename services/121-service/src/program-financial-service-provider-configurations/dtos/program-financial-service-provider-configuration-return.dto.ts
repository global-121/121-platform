import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { ApiProperty } from '@nestjs/swagger';

export class ProgramFinancialServiceProviderConfigurationReturnDto {
  @ApiProperty({ example: 1, type: 'number' })
  public readonly programId: number;

  @ApiProperty({ enum: FinancialServiceProviderName, type: 'enum' })
  public readonly financialServiceProviderName: FinancialServiceProviderName;

  @ApiProperty({ example: 'FSP Name', type: 'string' })
  public readonly name: string;

  @ApiProperty({ type: 'object' })
  public readonly label: LocalizedString;

  @ApiProperty({ type: 'object' })
  public readonly financialServiceProvider: FinancialServiceProviderDto;
}
