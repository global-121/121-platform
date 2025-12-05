import { Test, TestingModule } from '@nestjs/testing';

import { CreateOrderResponseNedbankApiDto } from '@121-service/src/fsp-integrations/integrations/nedbank/dtos/nedbank-api/create-order-response-nedbank-api.dto';
import { ErrorReponseNedbankApiDto } from '@121-service/src/fsp-integrations/integrations/nedbank/dtos/nedbank-api/error-response-nedbank-api.dto';
import { NedbankVoucherStatus } from '@121-service/src/fsp-integrations/integrations/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankApiHelperService } from '@121-service/src/fsp-integrations/integrations/nedbank/services/nedbank-api.helper.service';

describe('NedbankApiHelperService', () => {
  let service: NedbankApiHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NedbankApiHelperService],
    }).compile();

    service = module.get<NedbankApiHelperService>(NedbankApiHelperService);
  });

  describe('isNedbankErrorResponse', () => {
    it('should return true for a valid error response', () => {
      const response: ErrorReponseNedbankApiDto = {
        Message: 'Error',
        Code: 'NB.APIM.Field.Invalid',
        Id: 'some-id',
        Errors: [],
      };

      expect(service.isNedbankErrorResponse(response)).toBe(true);
    });

    it('should return false for a non-error response', () => {
      const response: CreateOrderResponseNedbankApiDto = {
        Data: {
          OrderId: '',
          Status: NedbankVoucherStatus.PENDING,
        },
        Links: { Self: '' },
        Meta: {},
      };
      expect(service.isNedbankErrorResponse(response)).toBe(false);
    });

    it('should return true for a response with no Data property', () => {
      const response = 'Recourse not found';
      expect(service.isNedbankErrorResponse(response)).toBe(true);
    });
  });

  describe('createErrorMessageIfApplicable', () => {
    it('should format an error message correctly', () => {
      const errorResponse: ErrorReponseNedbankApiDto = {
        Message: 'BUSINESS ERROR',
        Code: 'NB.APIM.Field.Invalid',
        Id: '1d3e3076-9e1c-4933-aa7f-69290941ec70',
        Errors: [
          { ErrorCode: 'NB.APIM.Field.Invalid', Message: 'Error message' },
        ],
      };

      const errorMessage =
        service.createErrorMessageIfApplicable(errorResponse);

      expect(errorMessage).toContain('BUSINESS ERROR');
      expect(errorMessage).toContain('NB.APIM.Field.Invalid');
      expect(errorMessage).toContain('Error message');
    });

    it('should return default error for no errors', () => {
      expect(
        service.createErrorMessageIfApplicable({
          Errors: [],
        } as unknown as ErrorReponseNedbankApiDto),
      ).toMatchSnapshot();
    });

    it('should format an error message with only errors', () => {
      const errorResponse: ErrorReponseNedbankApiDto = {
        Message: '',
        Code: '',
        Id: '',
        Errors: [
          { ErrorCode: 'NB.APIM.Field.Invalid', Message: 'Error message' },
        ],
      };

      const errorMessage =
        service.createErrorMessageIfApplicable(errorResponse);

      expect(errorMessage).toContain('Errors: Error message');
      expect(errorMessage).not.toContain('Message:');
      expect(errorMessage).not.toContain('Code:');
      expect(errorMessage).not.toContain('Id:');
    });
  });
});
