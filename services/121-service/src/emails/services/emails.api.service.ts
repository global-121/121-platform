import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class EmailsApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async sendEmail(payload: unknown): Promise<void> {
    try {
      await this.httpService.post<unknown>(
        //TODO: this should be one URL for both and without attachment
        env.AZURE_SENDING_EMAILS_WITH_ATTACHMENT_RESOURCE_URL,
        payload,
      );
    } catch (error) {
      console.error('Failed to send email through API', error);
      throw new Error('Failed to send email through API');
    }
  }
}
