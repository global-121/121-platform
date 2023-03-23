import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum IntersolveJumboJobName {
  getLastestVoucherBalance = 'get-latest-voucher-balance',
}
export class IntersolveJumboJobDetails {
  @ApiProperty({ example: IntersolveJumboJobName.getLastestVoucherBalance })
  @IsEnum(IntersolveJumboJobName)
  public readonly name: IntersolveJumboJobName;
}
