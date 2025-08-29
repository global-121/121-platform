import { IsISO8601, IsOptional } from 'class-validator';

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsISO8601()
  public fromDate?: string;

  @IsOptional()
  @IsISO8601()
  public toDate?: string;

  @IsOptional()
  public format?: string;

  @IsOptional()
  public paymentId?: number;
}
