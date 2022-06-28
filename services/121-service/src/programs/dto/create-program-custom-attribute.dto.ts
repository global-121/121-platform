import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsJSON } from 'class-validator';
import { ProgramPhase } from '../../shared/enum/program-phase.model';

export enum CustomAttributeType {
  text = 'text',
  boolean = 'boolean',
}

export class CreateProgramCustomAttributeDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([CustomAttributeType.text, CustomAttributeType.boolean])
  public readonly type: CustomAttributeType;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsJSON()
  public label: JSON;
  @ApiModelProperty({
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
  @ApiModelProperty({
    example: [
      {
        name: 'mycustom',
        type: 'string',
        label: { en: 'MyCustom' },
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.payment,
        ],
      },
    ],
  })
  public readonly attributes: CreateProgramCustomAttributeDto[];
}
