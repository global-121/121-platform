import { PaymentAggregationSummaryDto } from '@121-service/src/payments/dto/payment-aggregation-summary.dto';

export class AggregatePerPayment {
  id: number;
  date: Date;
  aggregatedStatuses: PaymentAggregationSummaryDto;
}

export class AggregatePerMonth {
  [month: string]: {
    success: number;
    waiting: number;
    failed: number;
    pendingApproval: number;
    approved: number;
  };
}
