import { Test } from '@nestjs/testing';

import { FailedValidationEmailPayload } from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsModule } from '@121-service/src/emails/emails.module';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { env } from '@121-service/src/env';

describe('EmailsService - send validation failed email', () => {
  let emailsService: EmailsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmailsModule],
    }).compile();

    emailsService = moduleRef.get<EmailsService>(EmailsService);
  });

  it('should successfully send a failed validation email with attachment to Azure', async () => {
    const csvContent =
      'referenceId,error\ntest-123,Invalid phone number\ntest-456,Missing name';
    const base64Content: string = Buffer.from(csvContent, 'utf8').toString(
      'base64',
    );
    const email = env.MY_EMAIL_ADDRESS;
    const emailObject: FailedValidationEmailPayload = {
      email,
      displayName: 'Test User',
      attachment: {
        name: 'test-report.csv',
        contentBytes: base64Content,
      },
    };

    await expect(
      emailsService.sendValidationFailedEmail(emailObject),
    ).resolves.not.toThrow();
  }, 30000); // 30 second timeout for external API call
});
