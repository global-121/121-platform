import { Test } from '@nestjs/testing';
import { readFileSync } from 'fs';

import { GenericEmailPayload } from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsModule } from '@121-service/src/emails/emails.module';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { getEmailBody } from '@121-service/src/emails/templates/genericTemplate';
import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

describe('EmailsService - sendGenericEmail Integration', () => {
  let emailsService: EmailsService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmailsModule],
    }).compile();

    emailsService = moduleRef.get<EmailsService>(EmailsService);
    customHttpService = moduleRef.get<CustomHttpService>(CustomHttpService);

    // Spy on the HTTP service to monitor calls without making actual external requests
    jest.spyOn(customHttpService, 'post').mockImplementation(async () => {
      return Promise.resolve({
        status: 200,
        data: { message: 'Email sent successfully' },
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should successfully send generic email with attachment', async () => {
    const filePath = './report.csv';
    const fileContent: Buffer = readFileSync(filePath);
    const base64Content: string = fileContent.toString('base64');
    const email = env.MY_EMAIL_ADDRESS;
    const emailObject: GenericEmailPayload = {
      email,
      subject: 'Registration update - some records failed',
      body: getEmailBody(
        'Some records failed to be updated. Please see the attached file for details.',
      ),
      attachment: {
        name: 'report.csv',
        contentBytes: base64Content,
      },
    };

    // Act
    await expect(
      emailsService.sendGenericEmail(emailObject),
    ).resolves.not.toThrow();

    // Assert
    expect(customHttpService.post).toHaveBeenCalledWith(
      env.AZURE_SENDING_EMAILS_WITH_ATTACHMENT_RESOURCE_URL,
      {
        email: emailObject.email,
        subject: emailObject.subject,
        body: emailObject.body,
        attachment: emailObject.attachment,
      },
    );
  });
});
