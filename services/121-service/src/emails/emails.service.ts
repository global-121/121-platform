import { Injectable } from '@nestjs/common';

import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class EmailsService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public buildEmailData({
    email,
    template,
  }: {
    readonly email: string;
    readonly template: EmailTemplate;
  }): EmailData {
    return {
      email,
      subject: template.subject,
      body: template.body,
    };
  }

  public async sendEmail(emailData: EmailData): Promise<void> {
    await this.httpService.post<unknown>(env.AZURE_EMAIL_API_URL, emailData);
  }
}
