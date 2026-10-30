import { Injectable } from '@nestjs/common';

import { GetSentEmailResponseDto } from '@mock-service/src/email/dto/get-sent-email-response.dto';
import { SendMailRequestDto } from '@mock-service/src/email/dto/send-mail-request.dto';

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
      subject,
      body: body.content,
      sentAt: new Date().toISOString(),
    };

    for (const toRecipient of toRecipients) {
      this.storeSentEmail({
        recipient: toRecipient.emailAddress.address,
        sentEmail,
      });
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
    this.sentEmailsByRecipient.set(recipientKey, [sentEmail, ...sentEmails]);
  }

  public getSentEmails({
    recipient,
  }: {
    recipient: string;
  }): GetSentEmailResponseDto[] {
    const recipientKey = this.toRecipientKey({ recipient });
    return this.sentEmailsByRecipient.get(recipientKey) ?? [];
  }

  public deleteSentEmails({ recipient }: { recipient: string }): void {
    const recipientKey = this.toRecipientKey({ recipient });
    this.sentEmailsByRecipient.delete(recipientKey);
  }

  private toRecipientKey({ recipient }: { recipient: string }): string {
    return recipient.toLowerCase();
  }
}
