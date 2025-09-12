import { Injectable } from '@nestjs/common';

import {
  CreateUserEmailPayload,
  GenericEmailPayload,
} from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsApiService } from '@121-service/src/emails/services/emails.api.service';
import { createNonSSOUserTemplate } from '@121-service/src/emails/templates/createNonSsoUserTemplate';
import { createSSOUserTemplate } from '@121-service/src/emails/templates/createSsoUserTemplate';
import { genericTemplate } from '@121-service/src/emails/templates/genericTemplate';
import { passwordResetTemplate } from '@121-service/src/emails/templates/passwordResetTemplate';

@Injectable()
export class EmailsService {
  public constructor(private readonly emailsApiService: EmailsApiService) {}

  public async sendCreateNonSSOUserEmail(
    payload: CreateUserEmailPayload,
  ): Promise<void> {
    const { subject, body } = createNonSSOUserTemplate(
      payload.displayName,
      payload.email,
      payload.password || '',
    );

    await this.emailsApiService.sendEmail({
      email: payload.email,
      subject,
      body,
    });
  }

  public async sendPasswordResetEmail(
    payload: CreateUserEmailPayload,
  ): Promise<void> {
    const { subject, body } = passwordResetTemplate(
      payload.displayName,
      payload.email,
      payload.password || '',
    );

    await this.emailsApiService.sendEmail({
      email: payload.email,
      subject,
      body,
    });
  }

  public async sendCreateSSOUserEmail(
    payload: CreateUserEmailPayload,
  ): Promise<void> {
    const { subject, body } = createSSOUserTemplate(
      payload.email,
      payload.displayName,
    );

    await this.emailsApiService.sendEmail({
      email: payload.email,
      subject,
      body,
    });
  }

  public async sendGenericEmail(payload: GenericEmailPayload): Promise<void> {
    const { subject, body } = genericTemplate(payload.subject, payload.body);

    await this.emailsApiService.sendEmail({
      email: payload.email,
      subject,
      body,
    });
  }
}
