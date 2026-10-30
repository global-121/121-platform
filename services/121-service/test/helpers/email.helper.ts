import { HttpStatus } from '@nestjs/common';

import { getMockServer } from '@121-service/test/helpers/utility.helper';

interface SentEmail {
  readonly sender: string;
  readonly recipients: string[];
  readonly subject: string;
  readonly body: string;
  readonly sentAt: string;
}

/**
 * Returns the emails newest first.
 */
export async function getSentEmails({
  recipient,
}: {
  recipient: string;
}): Promise<SentEmail[]> {
  const response = await getMockServer()
    .get('/email/messages')
    .query({ recipient });

  if (response.status !== HttpStatus.OK) {
    throw new Error(
      `Failed to get sent emails: ${response.status} - ${JSON.stringify(response.body)}`,
    );
  }

  return response.body;
}

export async function deleteSentEmails({
  recipient,
}: { recipient?: string } = {}): Promise<void> {
  const response = await getMockServer()
    .delete('/email/messages')
    .query(recipient === undefined ? {} : { recipient });

  if (response.status !== HttpStatus.NO_CONTENT) {
    throw new Error(
      `Failed to delete sent emails: ${response.status} - ${JSON.stringify(response.body)}`,
    );
  }
}
