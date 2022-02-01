import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

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
  public readonly type: string;
}
