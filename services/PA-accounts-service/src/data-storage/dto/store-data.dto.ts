import { IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class StoreDataDto {

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  readonly type: string;

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  readonly data: string;

}
