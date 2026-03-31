import { TestBed } from '@automock/jest';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/env', () => ({
  env: {
    AZURE_EMAIL_API_URL: 'https://email.example.org',
  },
}));

describe('EmailsService', () => {
  let service: EmailsService;
  let httpService: jest.Mocked<CustomHttpService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(EmailsService).compile();
    service = unit;
    httpService = unitRef.get(CustomHttpService);
  });

  describe('sendEmail', () => {
    const emailData = {
      email: 'recipient@example.org',
      subject: 'Test',
      body: '<p>Hello</p>',
    };

    it('should resolve when the response status is 2xx', async () => {
      httpService.post.mockResolvedValueOnce({ status: 202 });

      await expect(service.sendEmail(emailData)).resolves.not.toThrow();
    });

    it('should throw EmailDeliveryError when the response status is not 2xx', async () => {
      httpService.post.mockResolvedValueOnce({
        status: 500,
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
  });

  describe('sendFromTemplate', () => {
    it('should sanitize recipientName before passing it to the template builder', async () => {
      httpService.post.mockResolvedValueOnce({ status: 202 });
      const templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body: 'Body' });

      await service.sendFromTemplate({
        templateBuilder,
        input: {
          email: 'recipient@example.org',
          recipientName: '<b>Alice</b>',
        },
      });

      expect(templateBuilder).toHaveBeenCalledWith(
        expect.objectContaining({ recipientName: 'Alice' }),
      );
    });

    it('should wrap the template body with the email layout', async () => {
      httpService.post.mockResolvedValueOnce({ status: 202 });
      const templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body: 'Inner content' });

      await service.sendFromTemplate({
        templateBuilder,
        input: { email: 'recipient@example.org', recipientName: 'Alice' },
      });

      const postedBody = httpService.post.mock.calls[0][1] as { body: string };
      expect(postedBody.body).toContain('Inner content');
      expect(postedBody.body).toContain('121 Portal');
    });

    it('should forward the attachment to sendEmail', async () => {
      httpService.post.mockResolvedValueOnce({ status: 202 });
      const attachment = { name: 'file.csv', contentBytes: 'abc123' };
      const templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body: 'Body' });

      await service.sendFromTemplate({
        templateBuilder,
        input: { email: 'recipient@example.org', recipientName: 'Alice' },
        attachment,
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ attachment }),
      );
    });
  });
});
