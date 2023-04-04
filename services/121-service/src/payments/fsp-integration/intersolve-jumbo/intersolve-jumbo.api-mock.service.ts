import { Injectable } from '@nestjs/common';
import { PreOrderInfoDto } from './dto/pre-order-info.dto';
import { IntersolveJumboResultCode } from './enum/intersolve-jumbo-result-code.enum';

@Injectable()
export class IntersolveJumboApiMockService {
  public createPreOrder(preOrderDtoBatch: PreOrderInfoDto[]): object {
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
    for (const [index, element] of preOrderDtoBatch.entries()) {
      if (!element.addressCity) {
        response[
          'tns:CreatePreOrderResponse'
        ].WebserviceRequest.ResultCode._cdata =
          IntersolveJumboResultCode.InvalidOrderLine;
        response[
          'tns:CreatePreOrderResponse'
        ].WebserviceRequest.ResultDescription._cdata = `Error found in OrderLine ${
          index + 1
        }: Geconstateerde fouten: -STAD ongeldig! (Stad is niet ingevuld).`;
        return response;
      } else if (
        element.lastName.toLowerCase().includes('mock-fail-create-order')
      ) {
        response[
          'tns:CreatePreOrderResponse'
        ].WebserviceRequest.ResultCode._cdata =
          IntersolveJumboResultCode.InvalidOrderLine;
        response[
          'tns:CreatePreOrderResponse'
        ].WebserviceRequest.ResultDescription._cdata = `Error found in OrderLine ${
          index + 1
        }: Mock failed the create-pre-order step`;
        return response;
      }
    }
    return response;
  }

  public approvePreOrder(): object {
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
    return response;
  }
}
