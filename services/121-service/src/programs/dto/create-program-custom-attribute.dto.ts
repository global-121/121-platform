import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsJSON } from 'class-validator';

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
}

export class CreateProgramCustomAttributesDto {
  @ApiModelProperty({
    example: [
      {
        name: 'mycustom',
        type: 'string',
        label: { en: 'MyCustom' },
      },
    ],
  })
  public readonly attributes: CreateProgramCustomAttributeDto[];
}
