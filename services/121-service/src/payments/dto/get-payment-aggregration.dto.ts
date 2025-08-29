import { IsNumberString } from 'class-validator';

export class GetPaymentAggregationDto {
  @IsNumberString()
  projectId: number;

  @IsNumberString()
  paymentId: number;
}
