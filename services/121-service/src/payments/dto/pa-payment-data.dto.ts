import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

export class PaPaymentDataDto {
  public referenceId: string;
  public paymentAddress: string;
  public programFinancialServiceProviderConfigurationId: number;
  // TODO: Do not use the the PaPaymentDataDto in Intersolve voucher & CBE than we we can refactor this to not need the FinancialServiceProviders enum anymore
  public financialServiceProviderName: FinancialServiceProviders;
  public transactionAmount: number;
  public bulkSize: number;
  public userId: number;
  public transactionId?: number;
}
