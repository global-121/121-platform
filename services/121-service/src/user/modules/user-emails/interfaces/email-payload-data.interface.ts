import { EmailRecipient } from '@121-service/src/user/modules/user-emails/interfaces/email-recipient.interface';

export interface EmailPayloadData {
  emailRecipient: EmailRecipient;
  password?: string;
}
