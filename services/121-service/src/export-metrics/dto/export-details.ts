import { ApiModelProperty } from '@nestjs/swagger';

import { IsNumber } from 'class-validator';

export enum ExportType {
  allPeopleAffected = 'all-people-affected',
  duplicatePhoneNumbers = 'duplicate-phone-numbers',
  included = 'included',
  payment = 'payment',
  selectedForValidation = 'selected-for-validation',
  unusedVouchers = 'unused-vouchers',
  toCancelVouchers = 'to-cancel-vouchers',
}

export class ExportDetails {
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;

  @ApiModelProperty({
    enum: ExportType,
    example: Object.values(ExportType).join(' | '),
  })
  public readonly type: ExportType;

  @ApiModelProperty()
  public readonly minPayment: number | null;

  @ApiModelProperty()
  public readonly maxPayment: number | null;
}
