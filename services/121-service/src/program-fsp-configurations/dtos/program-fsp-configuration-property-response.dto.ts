import { ApiProperty } from '@nestjs/swagger';

import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';

export class ProgramFspConfigurationPropertyResponseDto {
  @ApiProperty({ example: 'username' })
  public readonly name: FspConfigurationProperties;

  @ApiProperty({ example: 'RC01' })
  public readonly value?: string | string[];

  @ApiProperty({ example: new Date() })
  public updated: Date;
}
