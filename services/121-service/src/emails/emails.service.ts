import { Injectable } from '@nestjs/common';

import { SUPPORT_EMAIL } from '@121-service/src/emails/emails.const';
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
    attachment,
  }: {
    templateBuilders: Record<TType, (input: TInput) => EmailTemplate>;
    input: TInput;
    type: TType;
    attachment?: EmailData['attachment'];
  }): Promise<void> {
    const sanitizedInput = {
      ...input,
      displayName: stripHtmlTags(input.displayName),
    };

    const template = templateBuilders[type](sanitizedInput);

    await this.sendEmail({
      email: sanitizedInput.email,
      subject: template.subject,
      body: this.wrapWithEmailLayout(template.body),
      attachment,
    });
  }

  public async sendEmail(emailData: EmailData): Promise<void> {
    await this.httpService.post<unknown>(env.AZURE_EMAIL_API_URL, emailData);
  }

  private wrapWithEmailLayout(content: string): string {
    return `
    <style>
    html,
    body {
      margin: 0;
      padding: 0;
      font-family: Open Sans, ui-sans-serif, system-ui, sans-serif;
    }
    .header,
    .footer {
      padding: 1.2em;
      color: #fff;
      background-color: #0A2C5E;
    }
    .content {
      padding: 1.2em;
      margin: 1.2em;
      margin-bottom: 2em;
      color: #000;
      background-color: #fff;
      border-radius: 0.5em;
      box-shadow: 0 0 0.75em rgba(0, 0, 0, 0.1);
    }
    </style>

    <div class="header">
      <h1>121 Portal</h1>
    </div>

    <div class="content">
      ${content}
    </div>

    <div class="footer">
      121 Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:#fff">${SUPPORT_EMAIL}</a>
    </div>
  `;
  }
}
