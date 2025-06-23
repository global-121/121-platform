import { ApiProperty } from '@nestjs/swagger';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspIntegrationType } from '@121-service/src/fsps/fsp-integration-type.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType } from '@121-service/src/wrapper.type';

export class FspDto {
  @ApiProperty({ example: 'fspName' })
  readonly name: WrapperType<Fsps>;

  @ApiProperty({ example: FspIntegrationType.api })
  readonly integrationType: WrapperType<FspIntegrationType>;

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
  readonly configurationProperties: { name: string; isRequired: boolean }[];
}
