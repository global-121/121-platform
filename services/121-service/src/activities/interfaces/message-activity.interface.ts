import { MessageStatus } from 'twilio/lib/rest/api/v2010/account/message';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';

export interface MessageActivity extends BaseActivity {
  type: ActivityTypeEnum.Message;
  attributes: {
    from: string;
    to: string;
    body: string;
    status: MessageStatus;
    mediaUrl: string | null;
    contentType: MessageContentType;
    errorCode: string | null;
  };
}
