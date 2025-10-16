import { EmailAttachment } from '@121-service/src/emails/interfaces/email-attachment.interface';
import { EmailRecipient } from '@121-service/src/emails/interfaces/email-recipient.interface';

export interface EmailPayloadData {
  emailRecipient: EmailRecipient;
  password?: string;
  attachment?: EmailAttachment;
}
