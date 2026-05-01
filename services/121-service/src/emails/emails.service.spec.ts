import { TestBed } from '@automock/jest';
import { HttpStatus } from '@nestjs/common';

import { AzureGraphTokenService } from '@121-service/src/emails/azure-graph-token.service';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const mockedEnv = {
  MOCK_AZURE_EMAIL: false,
  AZURE_GRAPH_API_URL: 'https://graph.example.org/v1.0',
  AZURE_EMAIL_SENDER_ADDRESS: 'no-reply@example.org',
  AZURE_USER_ASSIGNED_IDENTITY_CLIENT_ID: 'managed-identity-client-id',
};

jest.mock('@121-service/src/env', () => ({
  get env() {
    return mockedEnv;
  },
}));

describe('EmailsService', () => {
  let service: EmailsService;
  let httpService: jest.Mocked<CustomHttpService>;
  let azureGraphTokenService: jest.Mocked<AzureGraphTokenService>;

  beforeEach(() => {
    mockedEnv.MOCK_AZURE_EMAIL = false;
    mockedEnv.AZURE_GRAPH_API_URL = 'https://graph.example.org/v1.0';
    mockedEnv.AZURE_EMAIL_SENDER_ADDRESS = 'no-reply@example.org';
    mockedEnv.AZURE_USER_ASSIGNED_IDENTITY_CLIENT_ID =
      'managed-identity-client-id';

    const { unit, unitRef } = TestBed.create(EmailsService).compile();
    service = unit;
    httpService = unitRef.get(CustomHttpService);
    azureGraphTokenService = unitRef.get(AzureGraphTokenService);
    azureGraphTokenService.getAccessToken.mockResolvedValue('test-token');
  });

  describe('sendEmail', () => {
    const emailData = {
      email: 'recipient@example.org',
      subject: 'Test',
      body: '<p>Hello</p>',
    };

    it('should resolve when the response status is 2xx', async () => {
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });

      await expect(service.sendEmail(emailData)).resolves.toBeUndefined();
    });

    it('should throw EmailDeliveryError when the response status is not 2xx', async () => {
      httpService.post.mockResolvedValueOnce({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        statusText: 'Internal Server Error',
      });

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        EmailDeliveryError,
      );
    });

    it('should throw EmailDeliveryError when there is no status (e.g. network error)', async () => {
      httpService.post.mockResolvedValueOnce({ status: undefined });

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        EmailDeliveryError,
      );
    });

    it('should POST to the Microsoft Graph sendMail endpoint of the configured sender', async () => {
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });

      await service.sendEmail(emailData);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://graph.example.org/v1.0/users/no-reply%40example.org/sendMail',
        expect.any(Object),
        expect.any(Headers),
      );
    });

    it('should send a Graph-shaped payload with HTML body and a single recipient', async () => {
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });

      await service.sendEmail(emailData);

      const postedPayload = httpService.post.mock.calls[0][1];
      expect(postedPayload).toEqual({
        message: {
          subject: emailData.subject,
          body: { contentType: 'HTML', content: emailData.body },
          toRecipients: [{ emailAddress: { address: emailData.email } }],
        },
        saveToSentItems: false,
      });
    });

    it('should include the access token from the Azure User Assigned Managed Identity in the Authorization header', async () => {
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });

      await service.sendEmail(emailData);

      const postedHeaders = httpService.post.mock.calls[0][2] as Headers;
      expect(postedHeaders.get('Authorization')).toBe('Bearer test-token');
      expect(postedHeaders.get('Content-Type')).toBe('application/json');
      expect(azureGraphTokenService.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should propagate token acquisition errors', async () => {
      azureGraphTokenService.getAccessToken.mockRejectedValueOnce(
        new EmailDeliveryError('token failure'),
      );

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        EmailDeliveryError,
      );
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should attach a Graph file attachment when an attachment is provided', async () => {
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });
      const attachment = { name: 'file.csv', contentBytes: 'abc123' };

      await service.sendEmail({ ...emailData, attachment });

      const postedPayload = httpService.post.mock.calls[0][1] as {
        message: { attachments?: unknown[] };
      };
      expect(postedPayload.message.attachments).toEqual([
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: attachment.name,
          contentBytes: attachment.contentBytes,
        },
      ]);
    });

    it('should skip token acquisition and Authorization header when MOCK_AZURE_EMAIL is enabled', async () => {
      mockedEnv.MOCK_AZURE_EMAIL = true;
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });

      await service.sendEmail(emailData);

      const postedHeaders = httpService.post.mock.calls[0][2] as Headers;
      expect(postedHeaders.get('Authorization')).toBeNull();
      expect(postedHeaders.get('Content-Type')).toBe('application/json');
      expect(azureGraphTokenService.getAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('sendFromTemplate', () => {
    const email = 'recipient@example.org';
    const recipientName = 'Alice';

    it('should sanitize recipientName before passing it to the template builder', async () => {
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });
      const templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body: 'Body' });

      await service.sendFromTemplate({
        templateBuilder,
        input: {
          email,
          recipientName: '<b>Alice</b>',
        },
      });

      expect(templateBuilder).toHaveBeenCalledWith(
        expect.objectContaining({ recipientName }),
      );
    });

    it('should wrap the template body with the email layout', async () => {
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });
      const body = 'Inner content';
      const templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body });

      await service.sendFromTemplate({
        templateBuilder,
        input: { email, recipientName },
      });

      const postedPayload = httpService.post.mock.calls[0][1] as {
        message: { body: { content: string } };
      };
      expect(postedPayload.message.body.content).toContain(body);
      expect(postedPayload.message.body.content).toContain('121 Portal');
    });

    it('should forward the attachment to sendEmail as a Graph file attachment', async () => {
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });
      const attachment = { name: 'file.csv', contentBytes: 'abc123' };
      const templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body: 'Body' });

      await service.sendFromTemplate({
        templateBuilder,
        input: { email, recipientName },
        attachment,
      });

      const postedPayload = httpService.post.mock.calls[0][1] as {
        message: { attachments?: unknown[] };
      };
      expect(postedPayload.message.attachments).toEqual([
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: attachment.name,
          contentBytes: attachment.contentBytes,
        },
      ]);
    });
  });
});
