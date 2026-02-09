import { ApiProperty } from '@nestjs/swagger';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export class ProgramFspConfigurationPropertyResponseDto {
  @ApiProperty({ example: 'username' })
  public readonly name: FspConfigurationProperties;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'RC01' },
      { type: 'number', example: 1 },
      { type: 'boolean', example: true },
    ],
  })
  public readonly value?: FspConfigurationPropertyType;

  @ApiProperty({ example: new Date() })
  public updated: Date;
}
