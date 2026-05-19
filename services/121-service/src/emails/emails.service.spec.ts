import { TestBed } from '@automock/jest';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { GraphService } from '@121-service/src/emails/graph/graph.service';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

describe('EmailsService', () => {
  let service: EmailsService;
  let graphService: jest.Mocked<GraphService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(EmailsService).compile();
    service = unit;
    graphService = unitRef.get(GraphService);
    graphService.sendMail.mockResolvedValue(undefined);
  });

  describe('sendEmail', () => {
    it('should delegate to graphService.sendMail', async () => {
      const emailData = {
        email: 'recipient@example.org',
        subject: 'Test',
        body: '<p>Hello</p>',
      };

      await service.sendEmail(emailData);

      expect(graphService.sendMail).toHaveBeenCalledWith(emailData);
    });
  });

  describe('sendFromTemplate', () => {
    const email = 'recipient@example.org';
    const recipientName = 'Alice';

    it('should sanitize recipientName before passing it to the template builder', async () => {
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
      const body = 'Inner content';
      const templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body });

      await service.sendFromTemplate({
        templateBuilder,
        input: { email, recipientName },
      });

      const emailData = graphService.sendMail.mock.calls[0][0];
      expect(emailData.body).toContain(body);
      expect(emailData.body).toContain('121 Portal');
    });

    it('should forward the attachment to graphService.sendMail', async () => {
      const attachment = { name: 'file.csv', contentBytes: 'abc123' };
      const templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body: 'Body' });

      await service.sendFromTemplate({
        templateBuilder,
        input: { email, recipientName },
        attachment,
      });

      const emailData = graphService.sendMail.mock.calls[0][0];
      expect(emailData.attachment).toEqual(attachment);
    });
  });
});
