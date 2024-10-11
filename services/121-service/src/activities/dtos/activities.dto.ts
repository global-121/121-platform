import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { NotificationType } from '@121-service/src/notifications/twilio.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export class ActivitiesDto {
  meta: {
    availableTypes: ActivityTypeEnum[];
    count: Partial<Record<ActivityTypeEnum, number>>;
  };
  data: ActivityType[];
}

type ActivityType =
  | DataChangeActivity
  | MessageActivity
  | NoteActivity
  | StatusChangeActivity
  | TransactionActivity;

enum ActivityTypeEnum {
  Transaction = 'transaction',
  Message = 'message',
  Note = 'note',
  DataChange = 'data-change',
  StatusChange = 'status-change',
  FinancialServiceProviderChange = 'financial-service-provider-change', // ##TODO: Looks like this type is still missing in the rest of the code, e.g. extending from BaseActivity.
}

interface BaseActivity {
  id: string;
  user: {
    id: number;
    username: string;
  };
  created: Date;
  type: ActivityTypeEnum;
  attributes: Record<string, unknown>;
}

interface TransactionActivity extends BaseActivity {
  type: ActivityTypeEnum.Transaction;
  attributes: {
    payment: number;
    status: TransactionStatusEnum;
    amount: number;
    paymentDate: Date;
    fsp: string; // Financial service provider enum name, like "intersolve-visa";
    fspName: string; // Financial service provider name, like "Intersolve Visa";
    errorMessage: null | string;
    customData: unknown; // ##TODO: Do we want/need to expose customData via the API?
  };
}

interface NoteActivity extends BaseActivity {
  type: ActivityTypeEnum.Note;
  attributes: {
    text: string; // The note content
  };
}

interface MessageActivity extends BaseActivity {
  type: ActivityTypeEnum.Message;
  attributes: {
    from: string;
    to: string;
    body: string;
    status: string;
    type: NotificationType;
    mediaUrl: string | null;
    contentType: MessageContentType;
    errorCode: string | null;
  };
}

interface StatusChangeActivity extends BaseActivity {
  type: ActivityTypeEnum.StatusChange;
  attributes: {
    oldValue: RegistrationStatusEnum;
    newValue: RegistrationStatusEnum;
  };
}

interface DataChangeActivity extends BaseActivity {
  type: ActivityTypeEnum.DataChange;
  attributes: {
    fieldName: string;
    oldValue: string;
    newValue: string;
    reason: string; // Reason for the data change
  };
}
