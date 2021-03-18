import { IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class StoreDataDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly type: string;

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly data: string;
}
