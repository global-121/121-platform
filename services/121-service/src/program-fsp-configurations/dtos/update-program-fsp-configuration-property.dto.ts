import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export class UpdateProgramFspConfigurationPropertyDto {
  @ApiProperty({
    example: 'redcross-user',
    description:
      'Should be string (for e.g. name=username), boolean (for e.g. name=cardDistributionByMail), number (for e.g. name=maxToSpendPerMonthInCents) or array of strings (for e.g. name=columnsToExport)',
  })
  @IsNotEmpty()
  value: FspConfigurationPropertyType;
}
