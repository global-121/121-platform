import { ApiModelProperty } from '@nestjs/swagger';

import { IsString, Length } from 'class-validator';
import { StatusEnum } from '../../shared/enum/status.enum';

export class UploadFspReconciliationDto {
  @ApiModelProperty({ example: 1 })
  public payment: string;
  @ApiModelProperty({ example: StatusEnum.success })
  public status: string;
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  @IsString()
  public referenceId: string;
  @ApiModelProperty({ example: 50 })
  public amount: string;
}
