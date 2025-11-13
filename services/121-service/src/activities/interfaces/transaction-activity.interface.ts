import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { UILanguageTranslationPartial } from '@121-service/src/shared/types/ui-language-translation-partial.type';

export interface TransactionActivity extends BaseActivity {
  type: ActivityTypeEnum.Transaction;
  attributes: {
    transactionId: number;
    paymentId: number;
    status: TransactionStatusEnum;
    amount: number | null;
    paymentDate: Date;
    updatedDate: Date;
    fspName: Fsps | null;
    fspConfigurationLabel: UILanguageTranslationPartial | null;
    fspConfigurationName: string | null;
    errorMessage: string | null;
  };
}
