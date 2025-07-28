import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class EmailsApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async sendEmail(payload: unknown): Promise<void> {
    try {
      await this.httpService.post<unknown>(env.AZURE_EMAIL_API_URL, payload);
    } catch (error) {
      console.error('Failed to send email through API', error);
      throw new Error('Failed to send email through API');
    }
  }
}
