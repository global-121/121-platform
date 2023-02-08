import { FspName } from "../../fsp/enum/fsp-name.enum";

export class PaPaymentDataDto {
  public referenceId: string;
  public paymentAddress: string;
  public fspName: FspName;
  public paymentAmountMultiplier: number;
}
