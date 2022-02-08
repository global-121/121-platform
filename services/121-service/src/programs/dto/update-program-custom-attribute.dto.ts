import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsJSON } from 'class-validator';
import { CustomAttributeType } from './create-program-custom-attribute.dto';

export class UpdateProgramCustomAttributeDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([CustomAttributeType.string, CustomAttributeType.boolean])
  public readonly type: string;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsJSON()
  public label: string;
}

export class UpdateProgramCustomAttributesDto {
  @ApiModelProperty({
    example: [{ name: 'mycustom', type: 'string', label: { en: 'MyCustom' } }],
  })
  public readonly attributes: UpdateProgramCustomAttributeDto[];
}
