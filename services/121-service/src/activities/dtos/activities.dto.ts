import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { NotificationType } from '@121-service/src/notifications/twilio.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';

export class ActivitiesDto {
  meta: {
    availableTypes: ActivityItemType[];
    count: Partial<Record<ActivityItemType, number>>;
  };
  data: ActivityLogItem[];
}

export type ActivityLogItem =
  | DataChangeActivity
  | MessageActivity
  | NoteActivity
  | StatusUpdateActivity
  | TransactionActivity;

export enum ActivityItemType {
  DataChange = 'data-change',
  Transaction = 'transaction',
  Message = 'message',
  Note = 'note',
  StatusUpdate = 'status-update',
  FinancialServiceProviderChange = 'financial-service-provider-change',
}

interface BaseActivity {
  id: string;
  user: {
    id: number;
    username: string;
  };
  created: Date;
  activityType: ActivityItemType;
  attributes: Record<string, unknown>;
}

export interface TransactionActivity extends BaseActivity {
  activityType: ActivityItemType.Transaction;
  attributes: {
    payment: number;
    status: StatusEnum;
    amount: number;
    paymentDate: Date;
    fsp: string; // Financial service provider enum name, like "intersolve-visa";
    fspName: string; // Financial service provider name, like "Intersolve Visa";
    errorMessage: null | string;
    customData: unknown;
  };
}

export interface NoteActivity extends BaseActivity {
  activityType: ActivityItemType.Note;
  attributes: {
    text: string; // The note content
  };
}

export interface MessageActivity extends BaseActivity {
  activityType: ActivityItemType.Message;
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

export interface StatusUpdateActivity extends BaseActivity {
  activityType: ActivityItemType.StatusUpdate;
  attributes: {
    oldValue: RegistrationStatusEnum;
    newValue: RegistrationStatusEnum;
  };
}

export interface DataChangeActivity extends BaseActivity {
  activityType: ActivityItemType.DataChange;
  attributes: {
    fieldName: string;
    oldValue: string;
    newValue: string;
    reason: string; // Reason for the data change
  };
}
