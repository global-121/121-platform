import { FspName } from '../../fsp/financial-service-provider.entity';

export class PaPaymentDataDto {
  public referenceId: string;
  public paymentAddress: string;
  public fspName: FspName;
  public paymentAmountMultiplier: number;
}
