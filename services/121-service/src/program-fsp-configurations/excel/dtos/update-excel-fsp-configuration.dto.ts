import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateExcelFspConfigurationDto {
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
