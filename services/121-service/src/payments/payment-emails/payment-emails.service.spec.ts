import { TestBed } from '@automock/jest';

import { DEFAULT_DISPLAY_NAME } from '@121-service/src/emails/emails.const';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { PaymentEmailType } from '@121-service/src/payments/payment-emails/enum/payment-email-type.enum';
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

    it('should call azureLogService.logError with alert: true when sendFromTemplate throws', async () => {
      const sendError = new Error('Email service unavailable');
      emailsService.sendFromTemplate.mockRejectedValueOnce(sendError);

      await service.sendApprovalRequestToNextApprovers({
        programId,
        paymentId,
        approvers: [
          { emailAddress: 'approver@example.org', recipientName: 'Jane' },
        ],
      });

      expect(azureLogService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        true,
      );
    });

    it('should continue sending to subsequent approvers when one email fails', async () => {
      emailsService.sendFromTemplate
        .mockRejectedValueOnce(new Error('Email service unavailable'))
        .mockResolvedValueOnce(undefined);

      await service.sendApprovalRequestToNextApprovers({
        programId,
        paymentId,
        approvers: [
          { emailAddress: 'approver1@example.org', recipientName: 'Jane' },
          { emailAddress: 'approver2@example.org', recipientName: 'John' },
        ],
      });

      expect(emailsService.sendFromTemplate).toHaveBeenCalledTimes(2);
      expect(emailsService.sendFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: PaymentEmailType.approvalRequestToNextApprovers,
          input: expect.objectContaining({ email: 'approver2@example.org' }),
        }),
      );
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

    it('should call azureLogService.logError with alert: true when sendFromTemplate throws', async () => {
      const sendError = new Error('Email service unavailable');
      emailsService.sendFromTemplate.mockRejectedValueOnce(sendError);

      await service.sendApprovalConfirmationToCreator({
        programId,
        paymentId,
        paymentCreator,
        paymentCreatedAt: new Date('2026-03-15T14:30:00'),
      });

      expect(azureLogService.logError).toHaveBeenCalledWith(
        expect.any(Error),
        true,
      );
    });
  });
});
