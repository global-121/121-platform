import { IsNumberString } from 'class-validator';

export class GetPaymentAggregationDto {
  @IsNumberString()
  programId: number;

  @IsNumberString()
  payment: number;
}
