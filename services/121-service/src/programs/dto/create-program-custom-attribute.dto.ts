import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProgramPhase } from '../../shared/enum/program-phase.enum';

export enum CustomAttributeType {
  text = 'text',
  boolean = 'boolean',
  tel = 'tel',
}

export class UpdateProgramCustomAttributeDto {
  @ApiProperty({ example: 'text' })
  @IsNotEmpty()
  @IsString()
  @IsEnum(CustomAttributeType)
  public readonly type: CustomAttributeType;

  @ApiProperty({
    example: {
      en: 'District',
      fr: 'Département',
    },
  })
  @IsNotEmpty()
  public label: JSON;

  @ApiProperty({
    example: [
      ProgramPhase.registrationValidation,
      ProgramPhase.inclusion,
      ProgramPhase.payment,
    ],
  })
  @IsNotEmpty()
  public phases: JSON;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  public duplicateCheck: boolean;
}

export class CreateProgramCustomAttributeDto extends UpdateProgramCustomAttributeDto {
  @ApiProperty({ example: 'district' })
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
}
