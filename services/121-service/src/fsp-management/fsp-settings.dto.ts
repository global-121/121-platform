import { ApiProperty } from '@nestjs/swagger';

import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { WrapperType } from '@121-service/src/wrapper.type';

export class FspSettingsDto {
  @ApiProperty({ example: 'fspName' })
  readonly name: WrapperType<Fsps>;

  @ApiProperty({ example: FspIntegrationType.api })
  readonly integrationType: WrapperType<FspIntegrationType>;

  @ApiProperty({ example: { en: 'default label' } })
  readonly defaultLabel: UILanguageTranslation;

  @ApiProperty({
    example: [
      { name: 'houseNumber', isRequired: true },
      { name: 'houseNumberAddition', isRequired: false },
    ],
  })
  readonly attributes: {
    name: FspAttributes;
    isRequired: boolean;
  }[];

  @ApiProperty({
    example: [
      { name: 'columnsToExport', isRequired: true },
      { name: 'columnToMatch', isRequired: true },
    ],
  })
  readonly configurationProperties: {
    name: FspConfigurationProperties;
    isRequired: boolean;
  }[];
}
