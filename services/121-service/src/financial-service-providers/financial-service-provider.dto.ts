import { ApiProperty } from '@nestjs/swagger';

import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType } from '@121-service/src/wrapper.type';

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
      { name: 'houseNumber', isRequired: true },
      { name: 'houseNumberAddition', isRequired: false },
    ],
  })
  attributes: { name: string; isRequired: boolean }[];
}
