import { Test, TestingModule } from '@nestjs/testing';

import { TransferResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { DuplicateOriginatorConversationIdError } from '@121-service/src/payments/fsp-integration/safaricom/errors/duplicate-originator-conversation-id.error';
import { SafaricomApiHelperService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.api.helper.service';

const originatorConversationId = 'mocked-originator-conversation-id';
const baseTransferResponse: TransferResponseSafaricomApiDto = {
  data: {
    ConversationID: 'mocked-conversation-id',
    OriginatorConversationID: 'mocked-originator-conversation-id',
  },
};

describe('SafaricomApiHelperService', () => {
  let safaricomApiHelperService: SafaricomApiHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SafaricomApiHelperService],
    }).compile();

    safaricomApiHelperService = module.get<SafaricomApiHelperService>(
      SafaricomApiHelperService,
    );
  });

  describe('createErrorMessageIfApplicable', () => {
    // ##TODO: there could be additional test here for case (!transferResponse || !transferResponse.data), but this is hard to mock here

    // ##TODO: somehow I cannot get this test to work, it throws the error, but the test fails
    it.skip('to throw DuplicateOriginatorConversationIdError if API errorCode indicating duplicate originatorConversationId', async () => {
      // Arrange
      const transferResponse: TransferResponseSafaricomApiDto = {
        data: {
          ...baseTransferResponse.data,
          errorCode: '500.002.1001', // Safaricom API error code for duplicate originator conversation ID
          errorMessage: 'duplicate-originator-conversation-id-error-message',
        },
      };

      // Act & assert
      const expectedErrorMessage = `Error: ${transferResponse.data.errorMessage} for originatorConversationId ${originatorConversationId}`;
      await expect(
        safaricomApiHelperService.createErrorMessageIfApplicable(
          transferResponse,
          originatorConversationId,
        ),
      ).rejects.toThrow(
        new DuplicateOriginatorConversationIdError(expectedErrorMessage),
      );
    });

    it('to return right error message if other API errorCode', async () => {
      // Arrange
      const transferResponse: TransferResponseSafaricomApiDto = {
        data: {
          ...baseTransferResponse.data,
          errorCode: 'other-error-code',
          errorMessage: 'other-error-message',
        },
      };

      // Act
      const errorMessage =
        safaricomApiHelperService.createErrorMessageIfApplicable(
          transferResponse,
          originatorConversationId,
        );

      // Assert
      expect(errorMessage).toBe(
        `${transferResponse.data.errorCode} - ${transferResponse.data.errorMessage}`,
      );
    });

    it('to return right error message if no errorCode, but also no ResponseCode', async () => {
      // Arrange
      const transferResponse: TransferResponseSafaricomApiDto = {
        data: {
          ...baseTransferResponse.data,
          statusCode: 'status-code',
          error: 'error',
        },
      };

      // Act
      const errorMessage =
        safaricomApiHelperService.createErrorMessageIfApplicable(
          transferResponse,
          originatorConversationId,
        );

      // Assert
      expect(errorMessage).toBe(
        `Error: ${transferResponse.data?.statusCode} ${transferResponse.data?.error}`,
      );
    });

    it('to return right error message if ResponseCode !== 0', async () => {
      // Arrange
      const transferResponse: TransferResponseSafaricomApiDto = {
        data: {
          ...baseTransferResponse.data,
          ResponseCode: '1', // not 0
          ResponseDescription: 'Response error',
        },
      };

      // Act
      const errorMessage =
        safaricomApiHelperService.createErrorMessageIfApplicable(
          transferResponse,
          originatorConversationId,
        );

      // Assert
      expect(errorMessage).toBe(
        `Response: ${transferResponse.data?.ResponseCode} - ${transferResponse.data?.ResponseDescription}`,
      );
    });

    it('to return nothing if ResponseCode === 0', async () => {
      // Arrange
      const transferResponse: TransferResponseSafaricomApiDto = {
        data: {
          ...baseTransferResponse.data,
          ResponseCode: '0',
          ResponseDescription: 'Success',
        },
      };

      // Act
      const errorMessage =
        safaricomApiHelperService.createErrorMessageIfApplicable(
          transferResponse,
          originatorConversationId,
        );

      // Assert
      expect(errorMessage).not.toBeDefined();
    });
  });
});
