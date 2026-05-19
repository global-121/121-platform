import { TestBed } from '@automock/jest';
import { HttpStatus } from '@nestjs/common';

import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { AzureGraphTokenService } from '@121-service/src/emails/graph/azure-graph-token.service';
import { GraphService } from '@121-service/src/emails/graph/graph.service';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const mockEnv = {
  AZURE_GRAPH_API_URL: 'https://graph-api.example.test',
  AZURE_EMAIL_SENDER_ADDRESS: 'sender@example.org',
  MOCK_AZURE_EMAIL: true,
};

jest.mock('@121-service/src/env', () => ({
  get env() {
    return mockEnv;
  },
}));

describe('GraphService', () => {
  let service: GraphService;
  let httpService: jest.Mocked<CustomHttpService>;
  let azureGraphTokenService: jest.Mocked<AzureGraphTokenService>;

  const emailData: EmailData = {
    email: 'recipient@example.org',
    subject: 'Test subject',
    body: '<p>Hello</p>',
  };

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(GraphService).compile();
    service = unit;
    httpService = unitRef.get(CustomHttpService);
    azureGraphTokenService = unitRef.get(AzureGraphTokenService);
  });

  describe('sendMail', () => {
    it('should resolve without error when the API returns 202', async () => {
      httpService.post.mockResolvedValue({ status: HttpStatus.ACCEPTED });

      await expect(service.sendMail(emailData)).resolves.not.toThrow();
    });

    it('should throw EmailDeliveryError with HTTP details when the API returns a non-202 HTTP status', async () => {
      httpService.post.mockResolvedValue({
        status: HttpStatus.BAD_REQUEST,
        statusText: 'Bad Request',
      });

      await expect(service.sendMail(emailData)).rejects.toThrow(
        new EmailDeliveryError('Failed to send email: HTTP 400 Bad Request'),
      );
    });

    it('should throw EmailDeliveryError with network error details when the API is unreachable', async () => {
      httpService.post.mockResolvedValue({
        status: -61,
        statusText: 'ECONNREFUSED',
      });

      await expect(service.sendMail(emailData)).rejects.toThrow(
        new EmailDeliveryError(
          'Failed to send email: network error (ECONNREFUSED)',
        ),
      );
    });

    it('should throw EmailDeliveryError with "unknown" when the network error has no code', async () => {
      httpService.post.mockResolvedValue({
        status: undefined,
        statusText: undefined,
      });

      await expect(service.sendMail(emailData)).rejects.toThrow(
        new EmailDeliveryError('Failed to send email: network error (unknown)'),
      );
    });

    it('should call the sendMail endpoint with the encoded sender address', async () => {
      httpService.post.mockResolvedValue({ status: HttpStatus.ACCEPTED });

      await service.sendMail(emailData);

      const url = httpService.post.mock.calls[0][0];
      expect(url).toBe(
        'https://graph-api.example.test/users/sender%40example.org/sendMail',
      );
    });

    it('should map EmailData to the correct Graph payload', async () => {
      httpService.post.mockResolvedValue({ status: HttpStatus.ACCEPTED });

      await service.sendMail(emailData);

      const payload = httpService.post.mock.calls[0][1];
      expect(payload).toEqual({
        message: {
          subject: 'Test subject',
          body: { contentType: 'HTML', content: '<p>Hello</p>' },
          toRecipients: [
            { emailAddress: { address: 'recipient@example.org' } },
          ],
        },
        saveToSentItems: false,
      });
    });

    it('should add the Graph odata type to the attachment in the payload', async () => {
      httpService.post.mockResolvedValue({ status: HttpStatus.ACCEPTED });
      const attachment = { name: 'report.csv', contentBytes: 'abc123' };

      await service.sendMail({ ...emailData, attachment });

      const payload = httpService.post.mock.calls[0][1];
      expect(payload.message.attachments).toEqual([
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: 'report.csv',
          contentBytes: 'abc123',
        },
      ]);
    });
  });

  describe('sendMail (MOCK_AZURE_EMAIL: false)', () => {
    beforeEach(() => {
      mockEnv.MOCK_AZURE_EMAIL = false;
      httpService.post.mockResolvedValue({ status: HttpStatus.ACCEPTED });
      azureGraphTokenService.getAccessToken.mockResolvedValue('test-token');
    });

    afterEach(() => {
      mockEnv.MOCK_AZURE_EMAIL = true;
    });

    it('should call AzureGraphTokenService.getAccessToken', async () => {
      await service.sendMail(emailData);

      expect(azureGraphTokenService.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should pass an Authorization Bearer header to CustomHttpService.post', async () => {
      await service.sendMail(emailData);

      const headers = httpService.post.mock.calls[0][2] as Headers;
      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });
  });
});
