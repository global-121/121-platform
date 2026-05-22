import { Injectable } from '@nestjs/common';

import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { AzureGraphTokenService } from '@121-service/src/emails/graph/azure-graph-token.service';
import { GRAPH_ATTACHMENT_DATA_TYPE } from '@121-service/src/emails/graph/const/graph-attachment-data-type.cont';
import { GraphMessage } from '@121-service/src/emails/graph/interfaces/graph-message.interface';
import { GraphSendMailRequest } from '@121-service/src/emails/graph/interfaces/graph-send-mail-request.interface';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class GraphService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly azureGraphTokenService: AzureGraphTokenService,
  ) {}

  public async sendMail({
    email,
    subject,
    body,
    attachment,
  }: EmailData): Promise<void> {
    const url = this.getSendMailUrl();
    const payload = this.getSendMailPayload({ email, subject, body, attachment });
    const headers = await this.getAuthorizationHeaders();

    const response = await this.httpService.post<{
      status: number;
      statusText?: string;
    }>(url, payload, headers);

    if (response.status !== 202) {
      const isHttpResponse =
        typeof response.status === 'number' && response.status >= 100;

      const detail = isHttpResponse
        ? `HTTP ${response.status} ${response.statusText ?? ''}`.trim()
        : `network error (${response.statusText ?? 'unknown'})`;

      throw new EmailDeliveryError(`Failed to send email: ${detail}`);
    }
  }

  private getSendMailUrl(): string {
    const sender = encodeURIComponent(env.AZURE_EMAIL_SENDER_ADDRESS);
    return `${env.AZURE_GRAPH_API_URL}/users/${sender}/sendMail`;
  }

  private getSendMailPayload({
    email,
    subject,
    body,
    attachment,
  }: EmailData): GraphSendMailRequest {
    const message: GraphMessage = {
      subject,
      body: {
        contentType: 'HTML',
        content: body,
      },
      toRecipients: [{ emailAddress: { address: email } }],
    };

    if (attachment) {
      message.attachments = [
        {
          '@odata.type': GRAPH_ATTACHMENT_DATA_TYPE,
          name: attachment.name,
          contentBytes: attachment.contentBytes,
        }
      ]
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
