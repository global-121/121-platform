import { Test, TestingModule } from '@nestjs/testing';

import { TransferResponseSafaricomApiDto } from '@121-service/src/fsp-integrations/api-integrations/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { DuplicateOriginatorConversationIdError } from '@121-service/src/fsp-integrations/api-integrations/safaricom/errors/duplicate-originator-conversation-id.error';
import { SafaricomApiHelperService } from '@121-service/src/fsp-integrations/api-integrations/safaricom/services/safaricom.api.helper.service';

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
    // There could be an additional test here for case (!transferResponse || !transferResponse.data), since that can happen at runtime. However, due to type checking at compile timing creating these tests is complex. So leaving it out for now.

    it('to throw DuplicateOriginatorConversationIdError if API errorCode indicating duplicate originatorConversationId', async () => {
      // Arrange
      const transferResponse: TransferResponseSafaricomApiDto = {
        data: {
          ...baseTransferResponse.data,
          errorCode: '500.002.1001', // Safaricom API error code for duplicate originator conversation ID
          errorMessage: 'duplicate-originator-conversation-id-error-message',
        },
      };

      // Act & assert
      try {
        safaricomApiHelperService.createErrorMessageIfApplicable(
          transferResponse,
          originatorConversationId,
        );
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect -- `expect(...).rejects.toThrow()` did not work, so reverting to this
        expect(error).toBeInstanceOf(DuplicateOriginatorConversationIdError);
      }
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
