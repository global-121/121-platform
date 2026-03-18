import { AggregationsPerStatusDto } from '@121-service/src/payments/dto/aggregations-per-status.dto';
import { PaymentAggregationSummaryDto } from '@121-service/src/payments/dto/payment-aggregation-summary.dto';

export class AggregatePerPayment {
  id: number;
  date: Date;
  aggregatedStatuses: PaymentAggregationSummaryDto;
}

type MonthlyTransferValues = Record<keyof AggregationsPerStatusDto, number>;

export class AggregatePerMonth {
  [month: string]: MonthlyTransferValues;
}
