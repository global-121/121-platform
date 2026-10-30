import { Injectable } from '@nestjs/common';

import { GetSentEmailResponseDto } from '@mock-service/src/email/dto/get-sent-email-response.dto';
import { SendMailRequestDto } from '@mock-service/src/email/dto/send-mail-request.dto';

// Bounds memory usage, as the mock-service can run for a long time locally.
const MAX_SENT_EMAILS_PER_RECIPIENT = 50;

@Injectable()
export class EmailMockService {
  private readonly sentEmailsByRecipient = new Map<
    string,
    GetSentEmailResponseDto[]
  >();

  public sendMail({
    sender,
    request,
  }: {
    sender: string;
    request: SendMailRequestDto;
  }): void {
    console.log('Mock email sent:', { sender, request });

    const { subject, body, toRecipients } = request.message;
    const sentEmail: GetSentEmailResponseDto = {
      sender,
      recipients: toRecipients.map(
        (recipient) => recipient.emailAddress.address,
      ),
      subject,
      body: body.content,
      sentAt: new Date().toISOString(),
    };

    for (const recipient of sentEmail.recipients) {
      this.storeSentEmail({ recipient, sentEmail });
    }
  }

  private storeSentEmail({
    recipient,
    sentEmail,
  }: {
    recipient: string;
    sentEmail: GetSentEmailResponseDto;
  }): void {
    const recipientKey = this.toRecipientKey({ recipient });
    const sentEmails = this.sentEmailsByRecipient.get(recipientKey) ?? [];
    const sentEmailsNewestFirst = [sentEmail, ...sentEmails];

    this.sentEmailsByRecipient.set(
      recipientKey,
      sentEmailsNewestFirst.slice(0, MAX_SENT_EMAILS_PER_RECIPIENT),
    );
  }

  public getSentEmails({
    recipient,
  }: {
    recipient: string;
  }): GetSentEmailResponseDto[] {
    const recipientKey = this.toRecipientKey({ recipient });
    return this.sentEmailsByRecipient.get(recipientKey) ?? [];
  }

  public deleteSentEmails({ recipient }: { recipient?: string }): void {
    if (recipient === undefined) {
      this.sentEmailsByRecipient.clear();
      return;
    }

    const recipientKey = this.toRecipientKey({ recipient });
    this.sentEmailsByRecipient.delete(recipientKey);
  }

  private toRecipientKey({ recipient }: { recipient: string }): string {
    return recipient.toLowerCase();
  }
}
