import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { CommercialBankEthiopiaTransferPayload } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';

export class CommercialBankEthiopiaJobDto {
  paPaymentData: PaPaymentDataDto;
  paymentNr: number;
  programId: number;
  payload: CommercialBankEthiopiaTransferPayload;
  credentials: { username: string; password: string };
  userId: number;
}
