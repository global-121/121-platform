import { setTimeout as delay } from 'node:timers/promises';

// eslint-disable-next-line n/no-process-env -- This environment variable `MAILPIT_API_URL` is NOT used in the 121-service, thus not managed via the env.ts file.
const MAILPIT_API_URL = process.env.MAILPIT_API_URL ?? 'http://localhost:8025';
const EMAIL_WAIT_TIMEOUT_MS = 10_000;
const EMAIL_POLL_INTERVAL_MS = 300;

interface MailpitMessageSummary {
  readonly ID: string;
}

interface MailpitSearchResponse {
  readonly messages: MailpitMessageSummary[];
}

export interface MailpitMessage {
  readonly Subject: string;
  readonly HTML: string;
  readonly Text: string;
}

const fetchMailpit = async (
  url: URL,
  options?: RequestInit,
): Promise<Response> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Mailpit request to ${url.pathname} failed: ${response.status} ${response.statusText}`,
    );
  }

  return response;
};

export const deleteAllEmails = async (): Promise<void> => {
  await fetchMailpit(new URL('/api/v1/messages', MAILPIT_API_URL), {
    method: 'DELETE',
  });
};

export const waitForEmail = async ({
  recipient,
  subject,
}: {
  recipient: string;
  subject: string;
}): Promise<MailpitMessage> => {
  const messageId = await pollForMessageId({
    recipient,
    subject,
    deadline: Date.now() + EMAIL_WAIT_TIMEOUT_MS,
  });

  return getMessage({ messageId });
};

const pollForMessageId = async ({
  recipient,
  subject,
  deadline,
}: {
  recipient: string;
  subject: string;
  deadline: number;
}): Promise<string> => {
  const messageId = await findLatestMessageId({ recipient, subject });

  if (messageId) {
    return messageId;
  }

  if (Date.now() >= deadline) {
    throw new Error(
      `Timed out after ${EMAIL_WAIT_TIMEOUT_MS}ms waiting for email "${subject}" to ${recipient}`,
    );
  }

  await delay(EMAIL_POLL_INTERVAL_MS);

  return pollForMessageId({ recipient, subject, deadline });
};

const findLatestMessageId = async ({
  recipient,
  subject,
}: {
  recipient: string;
  subject: string;
}): Promise<string | undefined> => {
  const url = new URL('/api/v1/search', MAILPIT_API_URL);
  url.searchParams.set('query', `to:"${recipient}" subject:"${subject}"`);

  const response = await fetchMailpit(url);
  const { messages } = (await response.json()) as MailpitSearchResponse;

  if (!messages.length) {
    return;
  }

  return messages[0].ID;
};

const getMessage = async ({
  messageId,
}: {
  messageId: string;
}): Promise<MailpitMessage> => {
  const response = await fetchMailpit(
    new URL(`/api/v1/message/${messageId}`, MAILPIT_API_URL),
  );

  return (await response.json()) as MailpitMessage;
};
