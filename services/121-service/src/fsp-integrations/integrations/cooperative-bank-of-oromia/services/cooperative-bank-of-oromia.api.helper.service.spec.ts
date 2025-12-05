import { Test, TestingModule } from '@nestjs/testing';

import { CooperativeBankOfOromiaApiTransferResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-response-body.dto';
import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaTransferMessageEnum } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-transfer-messages.enum';
import { CooperativeBankOfOromiaApiHelperService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.helper.service';

describe('CooperativeBankOfOromiaApiHelperService', () => {
  let service: CooperativeBankOfOromiaApiHelperService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: CooperativeBankOfOromiaApiHelperService,
          useValue: new CooperativeBankOfOromiaApiHelperService(),
        },
      ],
    }).compile();
    service = module.get<CooperativeBankOfOromiaApiHelperService>(
      CooperativeBankOfOromiaApiHelperService,
    );
  });

  it('should return success when response.success is true', () => {
    const response: CooperativeBankOfOromiaApiTransferResponseBodyDto = {
      success: true,
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.success,
    });
  });

  it('should return duplicate when error.messages is duplicateMessageId', () => {
    const response: CooperativeBankOfOromiaApiTransferResponseBodyDto = {
      success: false,
      error: {
        messages: CooperativeBankOfOromiaTransferMessageEnum.duplicateMessageId,
      },
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.duplicate,
    });
  });

  it('should return fail and parse error message for failed transfer with messages property', () => {
    const response: CooperativeBankOfOromiaApiTransferResponseBodyDto = {
      success: false,
      error: {
        description: 'Some error',
        code: 'ERR123',
        messages: 'Something went wrong messages',
      },
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.fail,
      message:
        'Error description: Some error, Error Code: ERR123, Message: Something went wrong messages',
    });
  });

  it('should return fail and parse error message for failed transfer with message property', () => {
    const response: CooperativeBankOfOromiaApiTransferResponseBodyDto = {
      success: false,
      error: {
        description: 'Some error',
        code: 'ERR123',
        message: 'Something went wrong message',
      },
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.fail,
      message:
        'Error description: Some error, Error Code: ERR123, Message: Something went wrong message',
    });
  });

  it('should return fail and unknown error message if error object is missing for failed transfer', () => {
    const response: CooperativeBankOfOromiaApiTransferResponseBodyDto = {
      success: false,
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.fail,
      message: 'Unknown error occurred',
    });
  });

  it('should return error message for account validation error', () => {
    const response = {
      success: false,
      error: { message: 'Account not found', code: 'T24Error' },
    };
    expect(service.handleAccountValidationResponse(response)).toEqual({
      errorMessage: 'Message: Account not found',
    });
  });

  it('should return unknown error for missing account validation error object', () => {
    const response = {
      success: false,
    };
    expect(service.handleAccountValidationResponse(response)).toEqual({
      errorMessage: 'Unknown error occurred',
    });
  });
});
