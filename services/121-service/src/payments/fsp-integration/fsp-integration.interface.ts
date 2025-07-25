import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FspTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';

export interface FspIntegrationInterface {
  sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    useWhatsapp?: boolean,
  ): Promise<void | FspTransactionResultDto>;
}
