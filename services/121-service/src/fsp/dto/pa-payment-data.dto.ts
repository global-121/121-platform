import { fspName } from '../financial-service-provider.entity';

export class PaPaymentDataDto {
  public referenceId: string;
  public paymentAddress: string;
  public fspName: fspName;
  public paymentAmountMultiplier: number;
}
