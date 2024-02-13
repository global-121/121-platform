import { PaPaymentDataDto } from '../../../dto/pa-payment-data.dto';
import { CommercialBankEthiopiaTransferPayload } from './commercial-bank-ethiopia-transfer-payload.dto';

export class CommercialBankEthiopiaJobDto {
  paPaymentData: PaPaymentDataDto;
  paymentNr: number;
  programId: number;
  payload: CommercialBankEthiopiaTransferPayload;
  credentials: { username: string; password: string };
  userId: number;
}
