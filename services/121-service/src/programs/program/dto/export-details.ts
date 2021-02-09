import { ApiModelProperty } from '@nestjs/swagger';

import { IsNumber } from 'class-validator';

export enum ExportType {
  allPeopleAffected = 'all-people-affected',
  included = 'included',
  selectedForValidation = 'selected-for-validation',
  payment = 'payment',
  unusedVouchers = 'unused-vouchers',
}

export class ExportDetails {
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;

  @ApiModelProperty({
    enum: ExportType,
    example: ExportType.included,
  })
  public readonly type: ExportType;

  @ApiModelProperty()
  public readonly installment: number | null;
}
