import { DataChangeActivity } from '@121-service/src/activities/interfaces/data-change-activity.interface';
import { FspChangeActivity } from '@121-service/src/activities/interfaces/fsp-change.interface';
import { IgnoredDuplicateActivity } from '@121-service/src/activities/interfaces/ignored-duplicate-activity.interface';
import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { NoteActivity } from '@121-service/src/activities/interfaces/note-activity.interface';
import { StatusChangeActivity } from '@121-service/src/activities/interfaces/status-change-activity.interface';
import { TransactionActivity } from '@121-service/src/activities/interfaces/transaction-activity.interface';

export type Activity =
  | DataChangeActivity
  | FspChangeActivity
  | MessageActivity
  | NoteActivity
  | StatusChangeActivity
  | TransactionActivity
  | IgnoredDuplicateActivity;
