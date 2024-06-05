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

    for (const [index, element] of preOrderDtoBatch.entries()) {
      if (!element.addressCity) {
        return this.createPreOrderResponse(
          IntersolveJumboResultCode.InvalidOrderLine,
          `Error found in OrderLine ${
            index + 1
          }: Geconstateerde fouten: -STAD ongeldig! (Stad is niet ingevuld).`,
        );
      } else if (
        element.lastName?.toLowerCase().includes('mock-fail-create-order')
      ) {
        return this.createPreOrderResponse(
          IntersolveJumboResultCode.InvalidOrderLine,
          `Error found in OrderLine ${
            index + 1
          }: Mock failed the create-pre-order step`,
        );
      }
    }

    return this.createPreOrderResponse(IntersolveJumboResultCode.Ok, null);
  }

  private createPreOrderResponse(code: string, description: string | null) {
    return {
      'tns:CreatePreOrderResponse': {
        WebserviceRequest: {
          ResultCode: {
            _cdata: code,
          },
          ResultDescription: {
            _cdata: description,
          },
          ReturnId: {
            _cdata: 'mock-return-id',
          },
        },
      },
    };
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
