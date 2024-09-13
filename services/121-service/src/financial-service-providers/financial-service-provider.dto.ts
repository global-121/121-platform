import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType } from '@121-service/src/wrapper.type';
import { ApiProperty } from '@nestjs/swagger';

export class FinancialServiceProviderDto {
  @ApiProperty({ example: 'fspName' })
  name: string;

  @ApiProperty({ example: FinancialServiceProviderIntegrationType.api })
  integrationType: WrapperType<FinancialServiceProviderIntegrationType>;

  @ApiProperty({ example: true })
  hasReconciliation: boolean;

  @ApiProperty({ example: { en: 'default label' } })
  defaultLabel: LocalizedString;

  @ApiProperty({ example: true })
  notifyOnTransaction: boolean;

  @ApiProperty({
    example: [
      { name: 'houseNumber', required: true },
      { name: 'houseNumberAddition', required: false },
    ],
  })
  attributes: { name: string; required: boolean }[];
}
