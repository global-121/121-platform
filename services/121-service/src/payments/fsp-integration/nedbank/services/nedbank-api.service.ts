import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { v4 as uuid } from 'uuid';

import { NedbankCreateOrderRequestBodyDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/create-order-request-body-nedbank.dto';
import { CreateOrderResponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/create-order-response-nedbank.dto';
import { GetOrderResponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/get-order-reponse-nedbank.dto';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankApiHelperService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank-api.helper.service';

//##TODO Discuss: I decided to not have unit tests for this service because all the functions are just calling the helper service
// There are no if's or else decisions in this service
// I could test the happy path but I think this is covered enough with integration tests and static typing of typescript

@Injectable()
export class NedbankApiService {
  public constructor(
    private readonly nedbankApiHelperService: NedbankApiHelperService,
  ) {}

  public async createOrder({
    transferAmount,
    phoneNumber,
    orderCreateReference,
    paymentReference,
  }: {
    transferAmount: number;
    phoneNumber: string;
    orderCreateReference: string;
    paymentReference: string;
  }): Promise<NedbankVoucherStatus> {
    const payload = this.createOrderPayload({
      transferAmount,
      phoneNumber,
      orderCreateReference,
      paymentReference,
    });

    const createOrderResponse = await this.makeCreateOrderCall(payload);
    return createOrderResponse.data.Data.Status;
  }

  private createOrderPayload({
    transferAmount,
    phoneNumber,
    orderCreateReference,
    paymentReference,
  }: {
    transferAmount: number;
    phoneNumber: string;
    orderCreateReference: string;
    paymentReference: string;
  }): NedbankCreateOrderRequestBodyDto {
    const currentDate = new Date();
    const expirationDateIsoString = new Date(
      currentDate.setDate(new Date().getDate() + 7),
    ).toISOString();

    return {
      Data: {
        Initiation: {
          InstructionIdentification: uuid().replace(/-/g, ''), // This should be a unique string without dashes or you get an error from nedbank
          InstructedAmount: {
            Amount: `${transferAmount.toString()}.00`, // This should be a string with two decimal places
            Currency: 'ZAR',
          },
          DebtorAccount: {
            SchemeName: 'account', // should always be 'account'
            Identification: process.env.NEDBANK_ACCOUNT_NUMBER!, // ##TODO should we check somewhere if the .env is set?
            Name: paymentReference, // ##TODO Not sure what to set here. Quote from the API word document from didirik: 'This is what shows on the SARCS statement. We can set this value for (manual) reconciliation purposes.'
          },
          CreditorAccount: {
            SchemeName: 'recipient',
            Identification: phoneNumber,
            Name: paymentReference, // Name cannot be left empty so set it to a default value found on nedbank api documentation
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
    payload: NedbankCreateOrderRequestBodyDto,
  ): Promise<AxiosResponse<CreateOrderResponseNedbankDto>> {
    const createOrderUrl = !!process.env.MOCK_NEDBANK
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/nedbank/v1/orders`
      : `${process.env.NEDBANK_API_URL}/v1/orders`;

    return this.nedbankApiHelperService.makeApiRequestOrThrow<CreateOrderResponseNedbankDto>(
      {
        url: createOrderUrl,
        method: 'POST',
        payload,
      },
    );
  }

  public async getOrderByOrderCreateReference(
    orderCreateReference: string,
  ): Promise<NedbankVoucherStatus> {
    const getOrderUrl = !!process.env.MOCK_NEDBANK
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/nedbank/v1/orders/references/${orderCreateReference}`
      : `${process.env.NEDBANK_API_URL}/v1/orders/references/${orderCreateReference}`;

    const response =
      await this.nedbankApiHelperService.makeApiRequestOrThrow<GetOrderResponseNedbankDto>(
        {
          url: getOrderUrl,
          method: 'GET',
        },
      );
    return response.data.Data.Transactions.Voucher.Status;
  }
}
