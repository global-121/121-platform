import { GraphFileAttachment } from '@121-service/src/emails/graph/interfaces/graph-file-attachment.interface';
import { GraphRecipient } from '@121-service/src/emails/graph/interfaces/graph-recipient.interface';

export interface GraphMessage {
  subject: string;
  body: { contentType: 'HTML'; content: string };
  toRecipients: GraphRecipient[];
  attachments?: GraphFileAttachment[];
}
