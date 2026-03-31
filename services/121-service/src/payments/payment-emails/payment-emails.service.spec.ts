import { TestBed } from '@automock/jest';

import { DEFAULT_DISPLAY_NAME } from '@121-service/src/emails/emails.const';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { PaymentEmailsService } from '@121-service/src/payments/payment-emails/payment-emails.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

jest.mock('@121-service/src/env', () => ({
  env: {
    REDIRECT_PORTAL_URL_HOST: 'https://portal.example.org',
  },
}));

describe('PaymentEmailsService', () => {
  let service: PaymentEmailsService;
  let emailsService: jest.Mocked<EmailsService>;
  let azureLogService: jest.Mocked<AzureLogService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(PaymentEmailsService).compile();
    service = unit;
    emailsService = unitRef.get(EmailsService);
    azureLogService = unitRef.get(AzureLogService);
  });

  describe('sendApprovalRequestToNextApprovers', () => {
    const programId = 3;
    const paymentId = 42;

    it('should include programId and paymentId in the payment URL', async () => {
      emailsService.sendFromTemplate.mockResolvedValueOnce(undefined);

      await service.sendApprovalRequestToNextApprovers({
        programId,
        paymentId,
        approvers: [
          { emailAddress: 'approver@example.org', recipientName: 'Jane' },
        ],
      });

      expect(emailsService.sendFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            paymentUrl: expect.stringContaining(
              `/program/${programId}/payments/${paymentId}`,
            ),
          }),
        }),
      );
    });

    it('should use DEFAULT_DISPLAY_NAME when recipientName is undefined', async () => {
      emailsService.sendFromTemplate.mockResolvedValueOnce(undefined);

      await service.sendApprovalRequestToNextApprovers({
        programId,
        paymentId,
        approvers: [
          { emailAddress: 'approver@example.org', recipientName: undefined },
        ],
      });

      expect(emailsService.sendFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            recipientName: DEFAULT_DISPLAY_NAME,
          }),
        }),
      );
    });

    it('should log error and not throw when sendFromTemplate throws EmailDeliveryError', async () => {
      emailsService.sendFromTemplate.mockRejectedValueOnce(
        new EmailDeliveryError('Azure is down'),
      );

      await expect(
        service.sendApprovalRequestToNextApprovers({
          programId,
          paymentId,
          approvers: [
            { emailAddress: 'approver@example.org', recipientName: 'Jane' },
          ],
        }),
      ).resolves.not.toThrow();
      expect(azureLogService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        true,
      );
    });

    it('should rethrow when sendFromTemplate throws a non-EmailDeliveryError', async () => {
      emailsService.sendFromTemplate.mockRejectedValueOnce(
        new TypeError('Broken template'),
      );

      await expect(
        service.sendApprovalRequestToNextApprovers({
          programId,
          paymentId,
          approvers: [
            { emailAddress: 'approver@example.org', recipientName: 'Jane' },
          ],
        }),
      ).rejects.toThrow('Broken template');
    });
  });

  describe('sendApprovalConfirmationToCreator', () => {
    const programId = 3;
    const paymentId = 42;
    const paymentCreator = {
      emailAddress: 'creator@example.org',
      recipientName: 'Alice',
    };

    it('should format paymentCreatedAt as dd/MM/yyyy, HH:mm', async () => {
      emailsService.sendFromTemplate.mockResolvedValueOnce(undefined);

      await service.sendApprovalConfirmationToCreator({
        programId,
        paymentId,
        paymentCreator,
        paymentCreatedAt: new Date('2026-03-15T14:30:00'),
      });

      expect(emailsService.sendFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            paymentCreatedAt: '15/03/2026, 14:30',
          }),
        }),
      );
    });

    it('should include programId and paymentId in the payment URL', async () => {
      emailsService.sendFromTemplate.mockResolvedValueOnce(undefined);

      await service.sendApprovalConfirmationToCreator({
        programId,
        paymentId,
        paymentCreator,
        paymentCreatedAt: new Date('2026-03-15T14:30:00'),
      });

      expect(emailsService.sendFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            paymentUrl: expect.stringContaining(
              `/program/${programId}/payments/${paymentId}`,
            ),
          }),
        }),
      );
    });

    it('should use DEFAULT_DISPLAY_NAME when recipientName is undefined', async () => {
      emailsService.sendFromTemplate.mockResolvedValueOnce(undefined);

      await service.sendApprovalConfirmationToCreator({
        programId,
        paymentId,
        paymentCreator: {
          emailAddress: 'creator@example.org',
          recipientName: undefined,
        },
        paymentCreatedAt: new Date('2026-03-15T14:30:00'),
      });

      expect(emailsService.sendFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            recipientName: DEFAULT_DISPLAY_NAME,
          }),
        }),
      );
    });

    it('should log error and not throw when sendFromTemplate throws EmailDeliveryError', async () => {
      emailsService.sendFromTemplate.mockRejectedValueOnce(
        new EmailDeliveryError('Azure is down'),
      );

      await expect(
        service.sendApprovalConfirmationToCreator({
          programId,
          paymentId,
          paymentCreator,
          paymentCreatedAt: new Date('2026-03-15T14:30:00'),
        }),
      ).resolves.not.toThrow();
      expect(azureLogService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        true,
      );
    });

    it('should rethrow when sendFromTemplate throws a non-EmailDeliveryError', async () => {
      emailsService.sendFromTemplate.mockRejectedValueOnce(
        new TypeError('Broken template'),
      );

      await expect(
        service.sendApprovalConfirmationToCreator({
          programId,
          paymentId,
          paymentCreator,
          paymentCreatedAt: new Date('2026-03-15T14:30:00'),
        }),
      ).rejects.toThrow('Broken template');
    });
  });
});
