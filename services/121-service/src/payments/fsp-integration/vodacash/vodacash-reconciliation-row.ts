import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum } from '../../../shared/enum/status.enum';

export class VodacashReconciliationRow {
  @ApiProperty({ example: +24300000000 })
  public phoneNumber: string;

  @ApiProperty({ example: StatusEnum.success })
  public status: string;

  @ApiProperty({ example: 50 })
  public amount: string;
}
