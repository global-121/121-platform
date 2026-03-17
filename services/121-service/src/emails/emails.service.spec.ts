import { Test, TestingModule } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

class CustomHttpServiceMock {
  public post = jest.fn();
}

describe('EmailsService', () => {
  let service: EmailsService;
  let httpService: CustomHttpServiceMock;

  beforeEach(async () => {
    httpService = new CustomHttpServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        { provide: CustomHttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get(EmailsService);
  });

  describe('sendFromTemplate', () => {
    const mockTemplate: EmailTemplate = {
      subject: 'Welcome',
      body: '<p>Hello</p>',
    };
    const builder = jest.fn().mockReturnValue(mockTemplate);
    const templateBuilders = { someType: builder };

    beforeEach(() => {
      builder.mockClear();
    });

    it('should sanitize displayName before passing it to the template builder', async () => {
      await service.sendFromTemplate({
        templateBuilders,
        input: { email: 'a@b.com', displayName: '<script>alert</script>Name' },
        type: 'someType',
      });

      expect(builder).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'alertName' }),
      );
    });

    it('should send the built email data via the http service', async () => {
      await service.sendFromTemplate({
        templateBuilders,
        input: { email: 'user@example.com', displayName: 'Test User' },
        type: 'someType',
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          email: 'user@example.com',
          subject: mockTemplate.subject,
          body: mockTemplate.body,
        }),
      );
    });
  });
});
