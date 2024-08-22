import {
  CreateUserEmailPayload,
  GenericEmailPayload,
} from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsApiService } from '@121-service/src/emails/emails.api.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailsService {
  public constructor(private readonly emailsApiService: EmailsApiService) {}

  public async sendCreateUserEmail(
    payload: CreateUserEmailPayload,
  ): Promise<void> {
    await this.emailsApiService.sendEmail(payload);
  }

  // Method to send a generic email
  public async sendGenericEmail(payload: GenericEmailPayload): Promise<void> {
    await this.emailsApiService.sendEmail(payload);
  }
}
