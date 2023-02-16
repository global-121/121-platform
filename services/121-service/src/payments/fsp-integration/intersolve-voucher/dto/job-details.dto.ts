import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum IntersolveJobName {
  getLastestVoucherBalance = 'get-latest-voucher-balance',
}
export class InersolveJobDetails {
  @ApiProperty({ example: IntersolveJobName.getLastestVoucherBalance })
  @IsEnum(IntersolveJobName)
  public readonly name: IntersolveJobName;
}
