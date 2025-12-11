import { ApiProperty } from '@nestjs/swagger';

import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
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
