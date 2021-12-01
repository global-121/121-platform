import { ApiModelProperty } from '@nestjs/swagger';

import { IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { StatusEnum } from '../../shared/enum/status.enum';

export class UploadFspReconciliationDto {
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly payment: number;
  @ApiModelProperty({ example: StatusEnum.success })
  @IsNumber()
  public readonly status: StatusEnum;
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  @IsString()
  @IsOptional()
  public readonly referenceId: string;
}
