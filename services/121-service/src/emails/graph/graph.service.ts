import { Injectable } from '@nestjs/common';

import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { AzureGraphTokenService } from '@121-service/src/emails/graph/azure-graph-token.service';
import { GraphMessage } from '@121-service/src/emails/graph/interfaces/graph-message.interface';
import { GraphSendMailRequest } from '@121-service/src/emails/graph/interfaces/graph-send-mail-request.interface';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const GRAPH_FILE_ATTACHMENT_TYPE = '#microsoft.graph.fileAttachment' as const;

@Injectable()
export class GraphService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly azureGraphTokenService: AzureGraphTokenService,
  ) {}

  public async sendMail(emailData: EmailData): Promise<void> {
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
}
