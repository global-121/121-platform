import { FinancialServiceProviderName } from '../../financial-service-provider/enum/financial-service-provider-name.enum';

export class PaPaymentDataDto {
  public referenceId: string;
  public paymentAddress: string;
  public fspName: FinancialServiceProviderName;
  public transactionAmount: number;
  public bulkSize: number;
  public userId: number;
  public transactionId?: number;
}
