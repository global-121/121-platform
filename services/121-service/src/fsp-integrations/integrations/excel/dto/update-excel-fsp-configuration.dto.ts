import { ApiProperty, PickType } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';

export class UpdateExcelFspConfigurationDto extends PickType(
  CreateProgramFspConfigurationDto,
  ['label'] as const,
) {
  @ApiProperty({ example: 'phoneNumber' })
  @IsString()
  @IsNotEmpty()
  public readonly uniqueIdentifierField: string;

  @ApiProperty({ example: ['fullName', 'phoneNumber'], required: false })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  public readonly exportFields?: string[];
}
