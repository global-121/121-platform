import { Injectable } from '@nestjs/common';

import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class EmailsApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async sendEmail(payload: unknown): Promise<void> {
    try {
      const emailApiUrl = process.env.AZURE_EMAIL_API_URL as string;

      const headers = [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ];

      await this.httpService.post<unknown>(emailApiUrl, payload, headers);
    } catch (error) {
      console.error('Failed to send email through API', error);
      throw new Error('Failed to send email');
    }
  }
}
