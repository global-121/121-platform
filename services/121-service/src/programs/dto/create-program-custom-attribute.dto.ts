import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProgramPhase } from '../../shared/enum/program-phase.model';

export enum CustomAttributeType {
  text = 'text',
  boolean = 'boolean',
  tel = 'tel',
}

export class CreateProgramCustomAttributeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(CustomAttributeType)
  public readonly type: CustomAttributeType;

  @ApiProperty()
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

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public duplicateCheck: boolean;
}

export class CreateProgramCustomAttributesDto {
  @ApiProperty({
    example: [
      {
        name: 'mycustom',
        type: 'text',
        label: { en: 'MyCustom' },
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.payment,
        ],
      },
    ],
  })
  @ValidateNested()
  @Type(() => CreateProgramCustomAttributeDto)
  public readonly attributes: CreateProgramCustomAttributeDto[];
}
