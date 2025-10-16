import { Injectable } from '@nestjs/common';

import { EmailType } from '@121-service/src/emails/enum/email-type.enum';
import { getEmailBody } from '@121-service/src/emails/helpers/get-body.helper';
import { getEmailSubject } from '@121-service/src/emails/helpers/get-subject.helper';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailPayloadData } from '@121-service/src/emails/interfaces/email-payload-data.interface';
import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class EmailsService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async sendEmail(
    emailType: EmailType,
    payloadData: EmailPayloadData,
  ): Promise<void> {
    const {
      emailRecipient: { email },
      attachment,
    } = payloadData;

    const emailData: EmailData = {
      email,
      subject: getEmailSubject(emailType),
      body: getEmailBody(emailType, payloadData),
      attachment,
    };

    try {
      await this.httpService.post<unknown>(env.AZURE_EMAIL_API_URL, emailData);
    } catch (error) {
      console.error('Failed to send email through API', error);
      throw new Error('Failed to send email through API');
    }
  }
}
