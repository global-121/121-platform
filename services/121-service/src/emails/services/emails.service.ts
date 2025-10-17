import { Injectable } from '@nestjs/common';

import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class EmailsService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async sendEmail(emailData: EmailData): Promise<void> {
    try {
      await this.httpService.post<unknown>(env.AZURE_EMAIL_API_URL, emailData);
    } catch (error) {
      console.error('Failed to send email through API', error);
      throw new Error('Failed to send email through API');
    }
  }
}
