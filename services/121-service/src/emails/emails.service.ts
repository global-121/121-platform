import { Injectable } from '@nestjs/common';

import { AzureGraphTokenService } from '@121-service/src/emails/azure-graph-token.service';
import { SUPPORT_EMAIL } from '@121-service/src/emails/emails.const';
import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

const GRAPH_FILE_ATTACHMENT_TYPE = '#microsoft.graph.fileAttachment';

interface GraphRecipient {
  emailAddress: { address: string };
}

interface GraphFileAttachment {
  '@odata.type': typeof GRAPH_FILE_ATTACHMENT_TYPE;
  name: string;
  contentBytes: string;
}

interface GraphMessage {
  subject: string;
  body: { contentType: 'HTML'; content: string };
  toRecipients: GraphRecipient[];
  attachments?: GraphFileAttachment[];
}

interface GraphSendMailRequest {
  message: GraphMessage;
  saveToSentItems: boolean;
}

@Injectable()
export class EmailsService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly azureGraphTokenService: AzureGraphTokenService,
  ) {}

  public async sendFromTemplate<
    TInput extends { email: string; recipientName: string },
  >({
    templateBuilder,
    input,
    attachment,
  }: {
    templateBuilder: (input: TInput) => EmailTemplate;
    input: TInput;
    attachment?: EmailData['attachment'];
  }): Promise<void> {
    const sanitizedInput = {
      ...input,
      recipientName: stripHtmlTags(input.recipientName),
    };

    const template = templateBuilder(sanitizedInput);

    await this.sendEmail({
      email: sanitizedInput.email,
      subject: template.subject,
      body: this.wrapWithEmailLayout(template.body),
      attachment,
    });
  }

  public async sendEmail(emailData: EmailData): Promise<void> {
    const url = this.getSendMailUrl();
    const payload = this.getSendMailPayload(emailData);
    const headers = await this.getAuthorizationHeaders();

    const response = await this.httpService.post<{
      status: number;
      statusText?: string;
    }>(url, payload, headers);

    const isSuccess =
      typeof response.status === 'number' &&
      response.status >= 200 &&
      response.status < 300;
    if (!isSuccess) {
      throw new EmailDeliveryError(
        `Failed to send email: HTTP ${response.status} ${response.statusText ?? ''}`.trim(),
      );
    }
  }

  private getSendMailUrl(): string {
    const sender = encodeURIComponent(env.AZURE_EMAIL_SENDER_ADDRESS);
    return `${env.AZURE_GRAPH_API_URL}/users/${sender}/sendMail`;
  }

  private getSendMailPayload(emailData: EmailData): GraphSendMailRequest {
    const message: GraphMessage = {
      subject: emailData.subject,
      body: {
        contentType: 'HTML',
        content: emailData.body,
      },
      toRecipients: [{ emailAddress: { address: emailData.email } }],
    };

    if (emailData.attachment) {
      message.attachments = [
        {
          '@odata.type': GRAPH_FILE_ATTACHMENT_TYPE,
          name: emailData.attachment.name,
          contentBytes: emailData.attachment.contentBytes,
        },
      ];
    }

    return {
      message,
      saveToSentItems: false,
    };
  }

  private async getAuthorizationHeaders(): Promise<Headers> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (!env.MOCK_AZURE_EMAIL) {
      const accessToken = await this.azureGraphTokenService.getAccessToken();
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return headers;
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
