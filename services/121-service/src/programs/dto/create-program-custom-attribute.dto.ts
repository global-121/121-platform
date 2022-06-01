import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsJSON } from 'class-validator';

export enum CustomAttributeType {
  string = 'string',
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
  @IsIn([CustomAttributeType.string, CustomAttributeType.boolean])
  public readonly type: CustomAttributeType;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsJSON()
  public label: JSON;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsJSON()
  public export: JSON;
}

export class CreateProgramCustomAttributesDto {
  @ApiModelProperty({
    example: [
      {
        name: 'mycustom',
        type: 'string',
        label: { en: 'MyCustom' },
        export: [
          'all-people-affected',
          'included',
          'selected-for-validation',
          'payment',
        ],
      },
    ],
  })
  public readonly attributes: CreateProgramCustomAttributeDto[];
}
