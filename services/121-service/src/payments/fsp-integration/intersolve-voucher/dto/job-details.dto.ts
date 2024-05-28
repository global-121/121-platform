import { WrapperType } from '@121-service/src/wrapper.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum IntersolveVoucherJobName {
  getLastestVoucherBalance = 'get-latest-voucher-balance',
}
export class IntersolveVoucherJobDetails {
  @ApiProperty({ example: IntersolveVoucherJobName.getLastestVoucherBalance })
  @IsEnum(IntersolveVoucherJobName)
  public readonly name: WrapperType<IntersolveVoucherJobName>;
}
