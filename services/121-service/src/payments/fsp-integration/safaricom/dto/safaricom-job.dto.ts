import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';

export class SafaricomJobDto {
  userInfo?: { id: string; referenceId: string; value: string }[]; // TODO refactor this to a different name RegistrationInfo?
  paPaymentData: PaPaymentDataDto;
  programId: number;
  paymentNr: number;
  userId: number;
}
