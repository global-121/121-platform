import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export interface TransactionActivity extends BaseActivity {
  type: ActivityTypeEnum.Transaction;
  attributes: {
    payment: number;
    status: TransactionStatusEnum;
    amount: number;
    paymentDate: Date;
    fsp: FinancialServiceProviders;
    fspName: LocalizedString;
    errorMessage?: string;
  };
}
