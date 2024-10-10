import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class ActivitiesDto {
  meta: {
    availableTypes: ActivityTypeEnum[];
    count: Partial<Record<ActivityTypeEnum, number>>;
  };
  data: Activity[];
}

export type Activity =
  | DataChangeActivity
  | FinancialServiceProviderChangeActivity
  | MessageActivity
  | NoteActivity
  | StatusChangeActivity
  | TransactionActivity;

export enum ActivityTypeEnum {
  Transaction = 'transaction',
  Message = 'message',
  Note = 'note',
  DataChange = 'data-change',
  StatusChange = 'status-change',
  FinancialServiceProviderChange = 'financial-service-provider-change',
}

interface BaseActivity {
  id: string;
  username?: string;
  created: Date;
  type: ActivityTypeEnum;
  attributes: Record<string, unknown>;
}

export interface TransactionActivity extends BaseActivity {
  type: ActivityTypeEnum.Transaction;
  attributes: {
    payment: number;
    status: TransactionStatusEnum;
    amount: number;
    paymentDate: Date;
    fsp: FinancialServiceProviderName;
    fspName: LocalizedString;
    errorMessage?: string;
  };
}

export interface NoteActivity extends BaseActivity {
  type: ActivityTypeEnum.Note;
  attributes: {
    text: string; // The note content
  };
}

export interface MessageActivity extends BaseActivity {
  type: ActivityTypeEnum.Message;
  attributes: {
    from: string;
    to: string;
    body: string;
    status: string;
    mediaUrl: string | null;
    contentType: MessageContentType;
    errorCode: string | null;
  };
}

export interface StatusChangeActivity extends BaseActivity {
  type: ActivityTypeEnum.StatusChange;
  attributes: {
    oldValue: RegistrationStatusEnum;
    newValue: RegistrationStatusEnum;
  };
}

export interface DataChangeActivity extends BaseActivity {
  type: ActivityTypeEnum.DataChange;
  attributes: {
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    reason: string | null; // Reason for the data change
  };
}

export interface FinancialServiceProviderChangeActivity extends BaseActivity {
  type: ActivityTypeEnum.FinancialServiceProviderChange;
  attributes: {
    oldValue: string | null;
    newValue: string | null;
    reason: string | null; // Reason for the data change
  };
}
