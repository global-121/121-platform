import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { UpdateExcelFspConfigurationDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/update-excel-fsp-configuration.dto';

export class CreateExcelFspConfigurationDto extends UpdateExcelFspConfigurationDto {
  @ApiProperty({ example: 'cash-in-hand' })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;
}
