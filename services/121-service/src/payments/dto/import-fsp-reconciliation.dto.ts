import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum } from '../../shared/enum/status.enum';

export class ImportFspReconciliationArrayDto {
  @ApiProperty({ example: +24300000000 })
  public phoneNumber: string;

  @ApiProperty({ example: StatusEnum.success })
  public status: string;

  @ApiProperty({ example: 50 })
  public amount: string;
}

export class ImportFspReconciliationDto {
  @ApiProperty({ example: [] })
  public validatedArray: ImportFspReconciliationArrayDto[];

  @ApiProperty({ example: 1 })
  public recordsCount: number;
}
