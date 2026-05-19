import { TestBed } from '@automock/jest';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { GraphService } from '@121-service/src/emails/graph/graph.service';

describe('EmailsService', () => {
  let service: EmailsService;
  let graphService: jest.Mocked<GraphService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(EmailsService).compile();
    service = unit;
    graphService = unitRef.get(GraphService);
    graphService.sendMail.mockResolvedValue(undefined);
  });

  describe('sendFromTemplate', () => {
    const email = 'recipient@example.org';
    const recipientName = 'Alice';
    let templateBuilder: jest.Mock;

    beforeEach(() => {
      templateBuilder = jest
        .fn()
        .mockReturnValue({ subject: 'Subj', body: 'Body' });
    });

    it('should sanitize recipientName before passing it to the template builder', async () => {
      await service.sendFromTemplate({
        templateBuilder,
        input: { email, recipientName: '<b>Alice</b>' },
      });

      expect(templateBuilder).toHaveBeenCalledWith(
        expect.objectContaining({ recipientName }),
      );
    });

    it('should pass the attachment to graphService.sendMail unchanged', async () => {
      const attachment = { name: 'report.csv', contentBytes: 'abc123' };

      await service.sendFromTemplate({
        templateBuilder,
        input: { email, recipientName },
        attachment,
      });

      const [emailData] = graphService.sendMail.mock.calls[0];
      expect(emailData.attachment).toEqual(attachment);
    });

    it('should wrap the template body with the email layout', async () => {
      await service.sendFromTemplate({
        templateBuilder,
        input: { email, recipientName },
      });

      const [emailData] = graphService.sendMail.mock.calls[0];
      expect(emailData.body).toMatchInlineSnapshot(`
       "
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
             Body
           </div>

           <div class="footer">
             121 Support: <a href="mailto:support@121.global" style="color:#fff">support@121.global</a>
           </div>
         "
      `);
    });
  });
});
