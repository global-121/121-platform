import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';

export interface GetTwilioMessageDto {
  created: Date;
  from: string;
  to: string;
  body: string;
  status: string; // ##TODO: might not be the correct type
  medialUrl: string;
  contentType: MessageContentType; //##TODO: might not be the correct type
  errorCode: string | null;
  userId: number;
  username: string;
}
