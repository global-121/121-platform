import { EmailAttachment } from '@121-service/src/emails/interfaces/email-attachment.interface';

export interface EmailData {
  email: string;
  subject: string;
  body: string;
  attachment?: EmailAttachment;
}
