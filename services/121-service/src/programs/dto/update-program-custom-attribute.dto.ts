import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';
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
}

export class UpdateProgramCustomAttributesDto {
  @ApiModelProperty()
  public readonly attributes: UpdateProgramCustomAttributeDto[];
}
