import { PaPaymentDataDto } from '../../../dto/pa-payment-data.dto';

export class SafaricomJobDto {
  userInfo: { id: string; referenceId: string; value: string }[];
  paPaymentData: PaPaymentDataDto;
  programId: number;
  paymentNr: number;
}
