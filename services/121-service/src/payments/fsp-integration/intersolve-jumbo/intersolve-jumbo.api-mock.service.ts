import { PreOrderInfoDto } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/dto/pre-order-info.dto';
import { IntersolveJumboResultCode } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/enum/intersolve-jumbo-result-code.enum';
import { waitForRandomDelay } from '@121-service/src/utils/waitFor.helper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IntersolveJumboApiMockService {
  public async createPreOrder(
    preOrderDtoBatch: PreOrderInfoDto[],
  ): Promise<object> {
    await waitForRandomDelay(100, 300);
    const response = {
      'tns:CreatePreOrderResponse': {
        WebserviceRequest: {
          ResultCode: {
            _cdata: IntersolveJumboResultCode.Ok,
          },
          ResultDescription: {
            _cdata: null,
          },
          ReturnId: {
            _cdata: 'mock-return-id',
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
        ].WebserviceRequest.ResultDescription._cdata =
          `Error found in OrderLine ${
            index + 1
          }: Geconstateerde fouten: -STAD ongeldig! (Stad is niet ingevuld).`;
        return response;
      } else if (
        element.lastName?.toLowerCase().includes('mock-fail-create-order')
      ) {
        response[
          'tns:CreatePreOrderResponse'
        ].WebserviceRequest.ResultCode._cdata =
          IntersolveJumboResultCode.InvalidOrderLine;
        response[
          'tns:CreatePreOrderResponse'
        ].WebserviceRequest.ResultDescription._cdata =
          `Error found in OrderLine ${
            index + 1
          }: Mock failed the create-pre-order step`;
        return response;
      }
    }
    return response;
  }

  public async approvePreOrder(): Promise<object> {
    await waitForRandomDelay(100, 300);

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
