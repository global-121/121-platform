import { Injectable } from '@nestjs/common';

import { SendMailRequestDto } from '@mock-service/src/email/dto/send-mail-request.dto';
import { SentEmailDto } from '@mock-service/src/email/dto/sent-email.dto';

// Bounds memory usage, as the mock-service can run for a long time locally.
const MAX_SENT_EMAILS_PER_RECIPIENT = 50;

@Injectable()
export class EmailMockService {
  private readonly sentEmailsByRecipient = new Map<string, SentEmailDto[]>();

  public sendMail({
    sender,
    request,
  }: {
    sender: string;
    request: SendMailRequestDto;
  }): void {
    // Matches the real Microsoft Graph `sendMail` endpoint, which returns
    // 202 Accepted with no body. The email is stored in memory, so tests can
    // read it back via `getSentEmails`.
    console.log('Mock email sent:', { sender, request });

    const { subject, body, toRecipients } = request.message;
    const sentEmail: SentEmailDto = {
      sender,
      recipients: toRecipients.map(
        (recipient) => recipient.emailAddress.address,
      ),
      subject,
      body: body.content,
      sentAt: new Date().toISOString(),
    };

    const recipientKeys = new Set(
      sentEmail.recipients.map((recipient) => this.toRecipientKey(recipient)),
    );
    for (const recipientKey of recipientKeys) {
      const sentEmails = this.sentEmailsByRecipient.get(recipientKey) ?? [];
      this.sentEmailsByRecipient.set(
        recipientKey,
        [sentEmail, ...sentEmails].slice(0, MAX_SENT_EMAILS_PER_RECIPIENT),
      );
    }
  }

  public getSentEmails({ recipient }: { recipient: string }): SentEmailDto[] {
    return this.sentEmailsByRecipient.get(this.toRecipientKey(recipient)) ?? [];
  }

  public deleteSentEmails({ recipient }: { recipient?: string }): void {
    if (recipient === undefined) {
      this.sentEmailsByRecipient.clear();
      return;
    }
    this.sentEmailsByRecipient.delete(this.toRecipientKey(recipient));
  }

  private toRecipientKey(recipient: string): string {
    return recipient.toLowerCase();
  }
}
