import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { WrapperType } from '@121-service/src/wrapper.type';

export enum IntersolveVoucherJobName {
  getLatestVoucherBalance = 'get-latest-voucher-balance',
}
export class IntersolveVoucherJobDetails {
  @ApiProperty({ example: IntersolveVoucherJobName.getLatestVoucherBalance })
  @IsEnum(IntersolveVoucherJobName)
  public readonly name: WrapperType<IntersolveVoucherJobName>;
}
