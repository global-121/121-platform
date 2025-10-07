import { EmailClient } from '@azure/communication-email';
import { Injectable } from '@nestjs/common';

import { supportEmail } from '@121-service/src/emails/templates/config.enum';
import { env } from '@121-service/src/env';

@Injectable()
export class EmailsApiService {
  public async sendEmail({
    email,
    subject,
    plainText,
  }: {
    email: string;
    subject: string;
    plainText: string;
  }): Promise<void> {
    const emailClient = new EmailClient(env.AZURE_EMAIL_API_URL);

    const emailMessage = {
      sender: supportEmail,
      content: {
        subject,
        plainText,
      },
      recipients: {
        to: [{ email }],
      },
    };

    try {
      const response = await emailClient.send(emailMessage);
      console.log(`Email sent successfully with ID: ${response.id}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
