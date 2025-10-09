import { Test } from '@nestjs/testing';

import { GenericEmailPayload } from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsModule } from '@121-service/src/emails/emails.module';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { env } from '@121-service/src/env';

describe('EmailsService - sendGenericEmail Integration', () => {
  let emailsService: EmailsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmailsModule],
    }).compile();

    emailsService = moduleRef.get<EmailsService>(EmailsService);
  });

  it('should successfully send generic email with attachment to Azure', async () => {
    const csvContent =
      'referenceId,error\ntest-123,Invalid phone number\ntest-456,Missing name';
    const base64Content: string = Buffer.from(csvContent, 'utf8').toString(
      'base64',
    );
    const email = env.MY_EMAIL_ADDRESS;
    const emailObject: GenericEmailPayload = {
      email,
      subject: 'Test: Registration update - some records failed',
      body: 'This is a test email. Some records failed to be updated. Please see the attached file for details.',
      attachment: {
        name: 'test-report.csv',
        contentBytes: base64Content,
      },
    };

    // Act & Assert - Should not throw an error if Azure resource is working
    await expect(
      emailsService.sendGenericEmail(emailObject),
    ).resolves.not.toThrow();
  }, 30000); // 30 second timeout for external API call
});
