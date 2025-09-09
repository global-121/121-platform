import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';

export class PaPaymentDataDto {
  public referenceId: string;
  public programFspConfigurationId: number;
  // TODO: Do not use the the PaPaymentDataDto in Intersolve voucher & CBE than we we can refactor this to not need the Fsps enum anymore
  public fspName: Fsps;
  public transactionAmount: number;
  public bulkSize: number;
  public userId: number;
  public transactionId?: number;
}
