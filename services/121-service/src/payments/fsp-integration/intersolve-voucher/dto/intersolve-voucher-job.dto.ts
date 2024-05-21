import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';

export class IntersolveVoucherJobDto {
  paymentInfo: PaPaymentDataDto;
  useWhatsapp: boolean;
  payment: number;
  credentials: { username: string; password: string };
  programId: number;
}
