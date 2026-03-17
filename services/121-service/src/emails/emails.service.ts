import { Injectable } from '@nestjs/common';

import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

@Injectable()
export class EmailsService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async sendFromTemplate<
    TType extends string,
    TInput extends { email: string; displayName: string },
  >({
    templateBuilders,
    input,
    type,
  }: {
    templateBuilders: Record<TType, (input: TInput) => EmailTemplate>;
    input: TInput;
    type: TType;
  }): Promise<void> {
    const sanitizedInput = {
      ...input,
      displayName: stripHtmlTags(input.displayName),
    };
    const template = templateBuilders[type](sanitizedInput);
    await this.sendEmail(
      this.buildEmailData({ email: sanitizedInput.email, template }),
    );
  }

  private buildEmailData({
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
