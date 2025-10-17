import { EmailAttachment } from '@121-service/src/user/modules/user-emails/interfaces/interfaces/email-attachment.interface';
import { EmailRecipient } from '@121-service/src/user/modules/user-emails/interfaces/interfaces/email-recipient.interface';

export interface EmailPayloadData {
  emailRecipient: EmailRecipient;
  password?: string;
  attachment?: EmailAttachment;
}
