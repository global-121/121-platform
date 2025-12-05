import { ApiProperty } from '@nestjs/swagger';

export class ExcelAggregateImportResultDto {
  @ApiProperty({ description: 'Number of records not found', example: 5 })
  public countNotFound: number;
  @ApiProperty({ description: 'Number of successful payments', example: 10 })
  public countPaymentSuccess: number;
  @ApiProperty({ description: 'Number of failed payments', example: 2 })
  public countPaymentFailed: number;
}
