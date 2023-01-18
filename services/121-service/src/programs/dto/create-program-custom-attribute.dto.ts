import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsJSON,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProgramPhase } from '../../shared/enum/program-phase.model';

export enum CustomAttributeType {
  text = 'text',
  boolean = 'boolean',
}

export class CreateProgramCustomAttributeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([CustomAttributeType.text, CustomAttributeType.boolean])
  public readonly type: CustomAttributeType;
  @ApiProperty()
  @IsNotEmpty()
  @IsJSON()
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
