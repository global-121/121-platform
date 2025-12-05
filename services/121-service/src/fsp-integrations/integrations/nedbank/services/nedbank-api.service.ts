import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { v4 as uuid } from 'uuid';

import { env } from '@121-service/src/env';
import { CreateOrderRequestBodyNedbankApiDto } from '@121-service/src/fsp-integrations/integrations/nedbank/dtos/nedbank-api/create-order-request-body-nedbank-api.dto';
import { CreateOrderResponseNedbankApiDto } from '@121-service/src/fsp-integrations/integrations/nedbank/dtos/nedbank-api/create-order-response-nedbank-api.dto';
import { GetOrderResponseNedbankApiDto } from '@121-service/src/fsp-integrations/integrations/nedbank/dtos/nedbank-api/get-order-response-nedbank-api.dto';
import { NedbankVoucherStatus } from '@121-service/src/fsp-integrations/integrations/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankApiClientService } from '@121-service/src/fsp-integrations/integrations/nedbank/services/nedbank-api-client.service';

@Injectable()
export class NedbankApiService {
  public constructor(
    private readonly nedbankApiClientService: NedbankApiClientService,
  ) {}

  public async createOrder({
    transferValue,
    phoneNumber,
    orderCreateReference,
    paymentReference,
  }: {
    transferValue: number;
    phoneNumber: string;
    orderCreateReference: string;
    paymentReference: string;
  }): Promise<NedbankVoucherStatus> {
    const payload = this.createOrderPayload({
      transferValue,
      phoneNumber,
      orderCreateReference,
      paymentReference,
    });

    const createOrderResponse = await this.makeCreateOrderCall(payload);
    return createOrderResponse.data.Data.Status;
  }

  private createOrderPayload({
    transferValue,
    phoneNumber,
    orderCreateReference,
    paymentReference,
  }: {
    transferValue: number;
    phoneNumber: string;
    orderCreateReference: string;
    paymentReference: string;
  }): CreateOrderRequestBodyNedbankApiDto {
    const currentDate = new Date();
    const expirationDateIsoString = new Date(
      currentDate.setDate(new Date().getDate() + 7),
    ).toISOString();

    return {
      Data: {
        Initiation: {
          InstructionIdentification: uuid().replace(/-/g, ''), // This should be a unique string without dashes or you get an error from nedbank
          InstructedAmount: {
            Amount: `${transferValue.toString()}.00`, // This should be a string with two decimal places
            Currency: 'ZAR',
          },
          DebtorAccount: {
            SchemeName: 'account', // should always be 'account'
            Identification: env.NEDBANK_ACCOUNT_NUMBER,
            Name: paymentReference,
          },
          CreditorAccount: {
            SchemeName: 'recipient',
            Identification: `00${phoneNumber}`, // 121 stores phone numbers with country code, without a 00 or + prefix. Nedbank API requires the 00 prefix.
            Name: paymentReference, // There was some unclarity from Nedbank's side if the Name field under CreditorAccount or the Name field under DebtorAccount would appear on their bank statements. So we decided to just set the paymentReference in both.
          },
        },
        ExpirationDateTime: expirationDateIsoString,
      },
      Risk: {
        OrderCreateReference: orderCreateReference,
        OrderDateTime: new Date().toISOString().split('T')[0], // This needs to be set to yyyy-mm-dd
      },
    };
  }

  private async makeCreateOrderCall(
    payload: CreateOrderRequestBodyNedbankApiDto,
  ): Promise<AxiosResponse<CreateOrderResponseNedbankApiDto>> {
    return this.nedbankApiClientService.makeApiRequestOrThrow<CreateOrderResponseNedbankApiDto>(
      {
        endpoint: 'v1/orders',
        method: 'POST',
        payload,
      },
    );
  }

  public async getOrderByOrderCreateReference(
    orderCreateReference: string,
  ): Promise<NedbankVoucherStatus> {
    const endpoint = `v1/orders/references/${orderCreateReference}`;
    const response =
      await this.nedbankApiClientService.makeApiRequestOrThrow<GetOrderResponseNedbankApiDto>(
        {
          endpoint,
          method: 'GET',
        },
      );
    return response.data.Data.Transactions.Voucher.Status;
  }
}
