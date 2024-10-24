import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

export class PaPaymentDataDto {
  public referenceId: string;
  public paymentAddress: string;
  public programFinancialServiceProviderConfigurationId: number;
  // ##TODO: Look into if we can do without financialServiceProviderName since we already have programFinancialServiceProviderConfigurationId
  public financialServiceProviderName: FinancialServiceProviders;
  public transactionAmount: number;
  public bulkSize: number;
  public userId: number;
  public transactionId?: number;
}
