import { IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { PaDataTypes } from '../enum/padata-types.enum';

export class StoreDataDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly type: PaDataTypes;

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly data: string;
}
