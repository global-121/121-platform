import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FspTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';

export interface FinancialServiceProviderIntegrationInterface {
  sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    useWhatsapp?: boolean,
  ): Promise<void | FspTransactionResultDto>;
  getQueueProgress(programId: number): Promise<number>;
}
