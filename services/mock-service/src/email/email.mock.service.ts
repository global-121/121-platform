import { Injectable } from '@nestjs/common';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';

import { SendMailRequestDto } from '@mock-service/src/email/dto/send-mail-request.dto';
import { env } from '@mock-service/src/env';

@Injectable()
export class EmailMockService {
  private readonly transporter: Transporter = createTransport({
    host: env.MAILPIT_SMTP_HOST,
    port: env.MAILPIT_SMTP_PORT,
    secure: false,
  });

  public async sendMail({
    sender,
    request: {
      message: {
        subject,
        body: { content },
        toRecipients,
        attachments,
      },
    },
  }: {
    sender: string;
    request: SendMailRequestDto;
  }): Promise<void> {
    const mailOptions: SendMailOptions = {
      from: sender,
      to: toRecipients.map(({ emailAddress }) => emailAddress.address),
      subject,
      html: content,
    };

    if (attachments) {
      mailOptions.attachments = attachments.map(({ name, contentBytes }) => ({
        filename: name,
        content: contentBytes,
        encoding: 'base64',
      }));
    }

    await this.transporter.sendMail(mailOptions);
  }
}
