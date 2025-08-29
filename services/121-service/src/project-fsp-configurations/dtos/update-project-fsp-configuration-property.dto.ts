import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateProjectFspConfigurationPropertyDto {
  @ApiProperty({
    example: 'redcross-user',
    description:
      'Should be string (for e.g. name=username) or array of strings (for e.g. name=columnsToExport)',
  })
  @IsNotEmpty()
  value: string | string[];
}
