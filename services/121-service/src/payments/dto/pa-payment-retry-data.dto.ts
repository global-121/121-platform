import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';

export class PaPaymentRetryDataDto extends PaPaymentDataDto {
  projectFspConfigurationName: string;
}
