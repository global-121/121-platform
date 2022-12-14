import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { StatusEnum } from '../../../shared/enum/status.enum';

export class VodacashReconciliationRow {
  @ApiProperty({ example: 1 })
  public payment: string;

  @ApiProperty({ example: StatusEnum.success })
  public status: string;

  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  @IsString()
  public referenceId: string;

  @ApiProperty({ example: 50 })
  public amount: string;
}
