import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

// TODO: This file is up for refactoring: splitting up into multiple files, consistent naming, using interfaces instead of classes and/or using param decorators.
export class FspTransactionResultDto {
  public fspName: Fsps;
  public paList: PaTransactionResultDto[];
}

export class PaTransactionResultDto {
  public referenceId: string;
  public status: TransactionStatusEnum;
  public message?: string | null;
  public notificationObjects?: TransactionNotificationObject[];
  public date?: Date;
  public customData?: any;
  public calculatedAmount: number;
  public fspName: Fsps;
  public messageSid?: string;
  public registrationId?: number;
  public errorMessage?: string | null;
}

export class TransactionNotificationObject {
  public notificationKey: string;
  public bulkSize: number;
  public dynamicContent?: string[] = [];
}
