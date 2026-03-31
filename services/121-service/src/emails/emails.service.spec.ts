import { TestBed } from '@automock/jest';
import { HttpStatus } from '@nestjs/common';

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
      httpService.post.mockResolvedValueOnce({ status: HttpStatus.ACCEPTED });
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

      const postedBody = httpService.post.mock.calls[0][1] as { body: string };
      expect(postedBody.body).toContain(body);
      expect(postedBody.body).toContain('121 Portal');
    });

    it('should forward the attachment to sendEmail', async () => {
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

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ attachment }),
      );
    });
  });
});
