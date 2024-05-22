import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

export class PaPaymentDataDto {
  public referenceId: string;
  public paymentAddress: string;
  public fspName: FinancialServiceProviderName;
  public transactionAmount: number;
  public bulkSize: number;
  public userId: number;
  public transactionId?: number;
}
