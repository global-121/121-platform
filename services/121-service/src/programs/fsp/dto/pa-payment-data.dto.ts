import { fspName } from '../financial-service-provider.entity';

export class PaPaymentDataDto {
  public referenceId: string;
  public paymentAddress: string;
  public fspName: fspName;
}

export class PaPaymentDataAggregateDto {
  public paymentAddress: string;
  public paPaymentDataList: PaPaymentDataDto[];
}
