import { StatusEnum } from 'src/shared/enum/status.enum';
import { FinancialServiceProviderName } from '../../financial-service-providers/enum/financial-service-provider-name.enum';

export class FspTransactionResultDto {
  public fspName: FinancialServiceProviderName;
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
  public fspName: FinancialServiceProviderName;
  public messageSid?: string;
  public registrationId?: number;
}

export class TransactionNotificationObject {
  public notificationKey: string;
  public bulkSize: number;
  public dynamicContent?: string[] = [];
}
