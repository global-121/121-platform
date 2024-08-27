import {
  CreateUserEmailPayload,
  GenericEmailPayload,
} from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsApiService } from '@121-service/src/emails/emails.api.service';
import { genericTemplate } from '@121-service/src/emails/templates/generalTemplate';
import { passwordResetTemplate } from '@121-service/src/emails/templates/passwordResetTemplate';
import { createSSOUserTemplate } from '@121-service/src/emails/templates/welcomeSSOTemplate';
import { createNonSSOUserTemplate } from '@121-service/src/emails/templates/welcomeTemplate';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailsService {
  public constructor(private readonly emailsApiService: EmailsApiService) {}

  public async sendCreateNonSSOUserEmail(
    payload: CreateUserEmailPayload,
  ): Promise<void> {
    const { subject, body } = createNonSSOUserTemplate(
      payload.username,
      payload.password || '',
    );

    await this.emailsApiService.sendEmail({
      email: payload.email,
      subject: subject,
      body: body,
    });
  }

  public async sendPasswordResetEmail(
    payload: CreateUserEmailPayload,
  ): Promise<void> {
    const { subject, body } = passwordResetTemplate(
      payload.username,
      payload.password || '',
    );

    await this.emailsApiService.sendEmail({
      email: payload.email,
      subject: subject,
      body: body,
    });
  }

  public async sendCreateSSOUserEmail(username: string): Promise<void> {
    const { subject, body } = createSSOUserTemplate(username);

    await this.emailsApiService.sendEmail({
      email: username,
      subject: subject,
      body: body,
    });
  }

  public async sendGenericEmail(payload: GenericEmailPayload): Promise<void> {
    const { subject, body } = genericTemplate(payload.subject, payload.body);

    await this.emailsApiService.sendEmail({
      email: payload.email,
      subject: subject,
      body: body,
    });
  }
}
