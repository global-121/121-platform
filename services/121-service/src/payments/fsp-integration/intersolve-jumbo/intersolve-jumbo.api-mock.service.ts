import { Injectable } from '@nestjs/common';
import { IntersolveCreatePreOrderResponse } from './dto/intersolve-create-pre-order-response.dto';
import { IntersolveJumboResultCode } from './enum/intersolve-jumbo-result-code.enum';

@Injectable()
export class IntersolveJumboApiMockService {
  private mockApproveFailCode = 'make-mock-approve-fail';

  public createPreOrder(lastName: string): object {
    const response = {
      'tns:CreatePreOrderResponse': {
        WebserviceRequest: {
          ResultCode: {
            _cdata: IntersolveJumboResultCode.Ok,
          },
          ResultDescription: {
            _cdata: null,
          },
        },
      },
    };
    if (lastName.toLowerCase().includes('mock-fail-create-order')) {
      response[
        'tns:CreatePreOrderResponse'
      ].WebserviceRequest.ResultCode._cdata =
        IntersolveJumboResultCode.OrderNotValid;
      response[
        'tns:CreatePreOrderResponse'
      ].WebserviceRequest.ResultDescription._cdata =
        'Mock failed the create-pre-order step';
    } else if (lastName.toLowerCase().includes('mock-fail-approve-order')) {
      response[
        'tns:CreatePreOrderResponse'
      ].WebserviceRequest.ResultDescription._cdata = this.mockApproveFailCode;
    }
    return response;
  }

  public approvePreOrder(
    createPreOrder: IntersolveCreatePreOrderResponse,
  ): object {
    const response = {
      'tns:ApprovePreOrderResponse': {
        WebserviceRequest: {
          ResultCode: {
            _cdata: IntersolveJumboResultCode.Ok,
          },
          ResultDescription: {
            _cdata: null,
          },
        },
      },
    };
    if (
      createPreOrder['tns:CreatePreOrderResponse'].WebserviceRequest
        .ResultDescription._cdata === this.mockApproveFailCode
    ) {
      response[
        'tns:ApprovePreOrderResponse'
      ].WebserviceRequest.ResultCode._cdata =
        IntersolveJumboResultCode.OrderNotValid;
      response[
        'tns:ApprovePreOrderResponse'
      ].WebserviceRequest.ResultDescription._cdata =
        'Mock failed the approve-pre-order step';
    }
    return response;
  }
}
