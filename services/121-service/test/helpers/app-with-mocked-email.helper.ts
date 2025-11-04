import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ApplicationModule } from '@121-service/src/app.module';
import { EmailsService } from '@121-service/src/emails/emails.service';

/**
 * Helper to create a test application with mocked EmailsService
 * This is useful for integration tests that need to verify email notifications
 * without actually sending emails.
 */
export async function createAppWithMockedEmail(): Promise<{
  app: INestApplication;
  emailsService: jest.Mocked<EmailsService>;
  moduleFixture: TestingModule;
}> {
  // Create a comprehensive mock for EmailsService
  const emailsServiceMock = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    // Add other EmailsService methods if needed
    // sendSms: jest.fn().mockResolvedValue(undefined),
  };

  // Create test module with overridden EmailsService
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [ApplicationModule],
  })
    .overrideProvider(EmailsService)
    .useValue(emailsServiceMock)
    .compile();

  // Create and initialize the application
  const app = moduleFixture.createNestApplication();

  // Apply any global configurations that your main app uses
  // For example, if you have global pipes, filters, interceptors:
  // app.useGlobalPipes(new ValidationPipe());

  await app.init();

  // Get the mocked service instance
  const emailsService = app.get<EmailsService>(
    EmailsService,
  ) as jest.Mocked<EmailsService>;

  return {
    app,
    emailsService,
    moduleFixture,
  };
}

/**
 * Helper to wait for email notifications to be processed
 * This waits for queue jobs to complete processing
 */
export async function waitForEmailNotificationProcessing(
  _timeoutMs = 10000,
): Promise<void> {
  // This is a simplified version - you might need to integrate with your queue system
  // For example, if using Bull queues, you could wait for job completion

  return new Promise((resolve) => {
    // Simple timeout approach - replace with actual queue monitoring
    setTimeout(resolve, 2000);
  });
}

/**
 * Helper to reset email service mocks between tests
 */
export function resetEmailServiceMocks(
  emailsService: jest.Mocked<EmailsService>,
): void {
  emailsService.sendEmail.mockClear();
  // Clear other mocked methods as needed
}

/**
 * Note: This helper is available for application-level email mocking if needed,
 * but the recommended approach is using dedicated unit tests (see bulk-update-email-notifications.test.ts)
 * for email notification testing rather than complex integration test setups.
 */
