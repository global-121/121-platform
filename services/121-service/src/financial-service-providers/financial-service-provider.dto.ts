import { ApiProperty } from '@nestjs/swagger';

import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType } from '@121-service/src/wrapper.type';

export class FinancialServiceProviderDto {
  @ApiProperty({ example: 'fspName' })
  readonly name: string;

  @ApiProperty({ example: FinancialServiceProviderIntegrationType.api })
  readonly integrationType: WrapperType<FinancialServiceProviderIntegrationType>;

  @ApiProperty({ example: { en: 'default label' } })
  readonly defaultLabel: LocalizedString;

  @ApiProperty({ example: true })
  readonly notifyOnTransaction: boolean;

  @ApiProperty({
    example: [
      { name: 'houseNumber', isRequired: true },
      { name: 'houseNumberAddition', isRequired: false },
    ],
  })
  readonly attributes: { name: string; isRequired: boolean }[];
}
