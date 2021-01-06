import { ApiModelProperty } from '@nestjs/swagger';

import { IsNumber } from 'class-validator';

export class ExportDetails {
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
  @ApiModelProperty({ example: 'included' })
  public readonly type: ExportType;
  @ApiModelProperty()
  public readonly installment: number | null;
}

export enum ExportType {
  included = 'included',
  selectedForValidation = 'selected-for-validation',
  payment = 'payment',
  unusedVouchers = 'unused-vouchers',
}
