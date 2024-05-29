import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';

export type SplitPaymentListDto = {
  [key in FinancialServiceProviderName]?: PaPaymentDataDto[];
};
