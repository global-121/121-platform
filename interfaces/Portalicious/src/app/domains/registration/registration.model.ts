import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';

import { Dto } from '~/utils/dto-type';

// TODO: AB#30152 This type should be refactored to use Dto121Service
export type Registration = Dto<MappedPaginatedRegistrationDto>;

// We add the overview property to the ActivityLogItem type to be able to
// display a summary of the activity log item in the activity log table and make it searchable/filterable
export type ActivityLogItemWithOverview = {
  overview: string;
} & ActivityLogItem;

// TODO: AB#29984 Everything below should be defined in the 121-service
export enum ActivityLogItemType {
  DataChange = 'data-change',
  Message = 'message',
  Note = 'note',
  StatusUpdate = 'status-update',
  Transfer = 'transfer',
}

export type ActivityLogItem =
  | DataChangeActivity
  | MessageActivity
  | NoteActivity
  | StatusUpdateActivity
  | TransferActivity;

interface BaseActivity {
  author: string;
  date: Date;
  id: string;
  activityType: ActivityLogItemType;
  contents: Record<string, unknown>;
}

export interface TransferActivity extends BaseActivity {
  activityType: ActivityLogItemType.Transfer;
  contents: {
    transferNumber: number;
    totalTransfers: number;
    status: StatusEnum;
    amount: number;
    sent: Date;
    received?: Date;
    fsp: string; // Financial service provider, like "Intersolve"
    used?: string; // e.g., "Partly used"
    approvedBy: string; // e.g., "Samer@financial"
  };
}

export interface NoteActivity extends BaseActivity {
  activityType: ActivityLogItemType.Note;
  contents: {
    note: string; // The note content
  };
}

export interface MessageActivity extends BaseActivity {
  activityType: ActivityLogItemType.Message;
  contents: {
    messageType: string; // Type of message, e.g., "Custom Message" or "Registration"
    message: string; // Message content
  };
}

export interface StatusUpdateActivity extends BaseActivity {
  activityType: ActivityLogItemType.StatusUpdate;
  contents: {
    oldStatus: RegistrationStatusEnum;
    newStatus: RegistrationStatusEnum;
  };
}

export interface DataChangeActivity extends BaseActivity {
  activityType: ActivityLogItemType.DataChange;
  contents: {
    dataType: string; // Type of data being changed, e.g., "Phone number"
    oldData: string;
    newData: string;
    changeReason: string; // Reason for the data change
  };
}

export interface ActivityLogItemDto {
  data: ActivityLogItem[];
  meta: {
    // if a key is missing in this object, it means the user does not have permission to see it
    count: Partial<Record<ActivityLogItemType, number>>;
  };
}
