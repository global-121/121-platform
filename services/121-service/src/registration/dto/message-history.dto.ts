import { NotificationType } from '../../notifications/twilio.entity';

export class MessageHistoryDto {
  public created: Date;
  public from: string;
  public to: string;
  public body: string;
  public status: string;
  public type: NotificationType;
  public mediaUrl: string;
}
