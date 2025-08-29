import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { ReconciliationFeedbackDto } from '@121-service/src/payments/dto/reconciliation-feedback.dto';

export class ReconciliationResult {
  feedback: ReconciliationFeedbackDto;

  projectFspConfigurationId?: number;

  transaction?: PaTransactionResultDto;
}
