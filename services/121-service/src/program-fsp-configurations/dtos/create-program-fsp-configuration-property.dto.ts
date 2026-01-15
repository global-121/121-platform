import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { v4 as uuid } from 'uuid';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export class CreateProgramFspConfigurationPropertyDto {
  @ApiProperty({
    example: FspConfigurationProperties.username,
  })
  @IsNotEmpty()
  @IsEnum(FspConfigurationProperties)
  public readonly name: WrapperType<FspConfigurationProperties>;

  @ApiProperty({
    example: `password-${uuid()}`,
    description: `Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport)`,
  })
  @IsNotEmpty()
  public readonly value: string | string[];
}
