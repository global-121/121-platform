import { Test, TestingModule } from '@nestjs/testing';

import { CooperativeBankOfOromiaApiPaymentResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-payment-response-body.dto';
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
    const response: CooperativeBankOfOromiaApiPaymentResponseBodyDto = {
      success: true,
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.success,
    });
  });

  it('should return duplicate when error.messages is duplicateMessageId', () => {
    const response: CooperativeBankOfOromiaApiPaymentResponseBodyDto = {
      success: false,
      error: {
        messages: CooperativeBankOfOromiaTransferMessageEnum.duplicateMessageId,
      },
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.duplicate,
    });
  });

  it('should return fail and parse error message', () => {
    const response: CooperativeBankOfOromiaApiPaymentResponseBodyDto = {
      success: false,
      error: {
        description: 'Some error',
        code: 'ERR123',
        messages: 'Something went wrong',
      },
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.fail,
      message:
        'Error description: Some error, Error Code: ERR123, Message: Something went wrong',
    });
  });

  it('should return fail and unknown error message if error object is missing', () => {
    const response: CooperativeBankOfOromiaApiPaymentResponseBodyDto = {
      success: false,
    } as any;
    expect(service.handleTransferResponse(response)).toEqual({
      result: CooperativeBankOfOromiaTransferResultEnum.fail,
      message: 'Unknown error occurred',
    });
  });
});
