import { Injectable } from '@nestjs/common';
import { PreOrderInfoDto } from './dto/pre-order-info.dto';
import { IntersolveJumboResultCode } from './enum/intersolve-jumbo-result-code.enum';

@Injectable()
export class IntersolveJumboApiMockService {
  public async waitForRandomDelay(): Promise<void> {
    const min = 100;
    const max = 300;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, randomNumber));
  }

  public async createPreOrder(
    preOrderDtoBatch: PreOrderInfoDto[],
  ): Promise<object> {
    await this.waitForRandomDelay();
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
        ].WebserviceRequest.ResultDescription._cdata = `Error found in OrderLine ${
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
        ].WebserviceRequest.ResultDescription._cdata = `Error found in OrderLine ${
          index + 1
        }: Mock failed the create-pre-order step`;
        return response;
      }
    }
    return response;
  }

  public async approvePreOrder(): Promise<object> {
    await this.waitForRandomDelay();

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
