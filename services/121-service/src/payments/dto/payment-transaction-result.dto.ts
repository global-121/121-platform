import { StatusEnum } from 'src/shared/enum/status.enum';
import { FspName } from '../../fsp/enum/fsp-name.enum';

export class FspTransactionResultDto {
  public fspName: FspName;
  public paList: PaTransactionResultDto[];
}

export class PaTransactionResultDto {
  public referenceId: string;
  public status: StatusEnum;
  public message: string;
  public notificationObjects?: TransactionNotificationObject[];
  public date?: Date;
  public customData?: any;
  public calculatedAmount: number;
  public fspName: FspName;
  public messageSid?: string;
}

export class TransactionNotificationObject {
  public notificationKey: string;
  public bulkSize: number;
  public dynamicContent?: string[] = [];
}
