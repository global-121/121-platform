import { Test, TestingModule } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

class CustomHttpServiceMock {
  public post = jest.fn();
}

const mockTemplate: EmailTemplate = {
  subject: 'Test subject',
  body: 'Test body',
};

describe('EmailsService', () => {
  let service: EmailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        { provide: CustomHttpService, useClass: CustomHttpServiceMock },
      ],
    }).compile();

    service = module.get(EmailsService);
  });

  describe('sendFromTemplate', () => {
    enum TestEmailType {
      typeA = 'typeA',
      typeB = 'typeB',
    }

    interface TestEmailInput {
      email: string;
      displayName: string;
    }

    const builderA = jest.fn().mockReturnValue(mockTemplate);
    const builderB = jest.fn().mockReturnValue(mockTemplate);

    const templateBuilders: Record<
      TestEmailType,
      (input: TestEmailInput) => EmailTemplate
    > = {
      [TestEmailType.typeA]: builderA,
      [TestEmailType.typeB]: builderB,
    };

    beforeEach(() => {
      builderA.mockClear();
      builderB.mockClear();
    });

    it('should call the correct template builder for the given type', async () => {
      // Arrange
      const input: TestEmailInput = {
        email: 'user@example.com',
        displayName: 'Test User',
      };

      // Act
      await service.sendFromTemplate({
        templateBuilders,
        input,
        type: TestEmailType.typeA,
      });

      // Assert
      expect(builderA).toHaveBeenCalledTimes(1);
      expect(builderB).not.toHaveBeenCalled();
    });

    it('should sanitize displayName before passing it to the template builder', async () => {
      // Arrange
      const input: TestEmailInput = {
        email: 'user@example.com',
        displayName: 'Test <b>User</b>',
      };

      // Act
      await service.sendFromTemplate({
        templateBuilders,
        input,
        type: TestEmailType.typeA,
      });

      // Assert
      expect(builderA).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'Test User' }),
      );
    });

    it('should send the email with the address from the input', async () => {
      // Arrange
      const input: TestEmailInput = {
        email: 'user@example.com',
        displayName: 'Test User',
      };
      const sendEmailSpy = jest.spyOn(service, 'sendEmail');

      // Act
      await service.sendFromTemplate({
        templateBuilders,
        input,
        type: TestEmailType.typeA,
      });

      // Assert
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({ email: input.email }),
      );
    });
  });
});
