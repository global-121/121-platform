import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { NedbankCreateOrderMockPayload } from '@mock-service/src/fsp-integration/nedbank/nedbank.mock.controller';

export enum NedbankVoucherStatus { // Would be great if we could import this for the 121-service, unfortunately there is no easy way to do this yet.
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  REDEEMABLE = 'REDEEMABLE',
  REDEEMED = 'REDEEMED',
  REFUNDED = 'REFUNDED',
}

// +27 (the prefix of SA phonenumber) is not included in the number here because the (real nedbank) API accepts both with and without the prefix
enum NedbankMockNumber {
  failDebitorAccountIncorrect = '27000000001',
  failTimoutSimulate = '27000000002',
}

enum NebankGetOrderMockReference {
  orderNotFound = 'mock-order-not-found',
  tooManyRequestsForThisVoucher = 'mock-too-many-requests-for-this-voucher',
  phoneNumberIncorrect = 'mock-phone-number-incorrect',
  mock = 'mock',
}
@Injectable()
export class NedbankMockService {
  public async getOrder(orderCreateReference: string): Promise<object> {
    if (
      orderCreateReference.includes(
        NebankGetOrderMockReference.phoneNumberIncorrect,
      )
    ) {
      return {
        Message: 'BUSINESS ERROR',
        Code: 'NB.APIM.Field.Invalid',
        Id: 'c63aa83f-d183-486f-9e01-9d163180dbdd',
        Errors: [
          {
            ErrorCode: 'NB.APIM.Field.Invalid',
            Message:
              'Recipient.destination recipient mobile number provided is incorrect.',
            Path: '',
            Url: '',
          },
        ],
      };
    }

    if (
      orderCreateReference.includes(
        NebankGetOrderMockReference.tooManyRequestsForThisVoucher,
      )
    ) {
      return {
        Message: 'BUSINESS ERROR',
        Code: 'NB.APIM.TooManyRequestsError',
        Id: 'e0133b12-a6d5-4756-94fe-3c03fd0e9611',
        Errors: [
          {
            ErrorCode: 'NB.APIM.TooManyRequestsError',
            Message: 'Requested too many times',
            Path: '',
            Url: '',
          },
        ],
      };
    }

    if (orderCreateReference.includes(NebankGetOrderMockReference.mock)) {
      if (
        orderCreateReference.includes(NebankGetOrderMockReference.orderNotFound)
      ) {
        return {
          Message: 'BUSINESS ERROR',
          Code: 'NB.APIM.Resource.NotFound',
          Id: 'f1efff05-bfb2-422b-8b3c-08d3eda34da9',
          Errors: [
            {
              ErrorCode: 'NB.APIM.Resource.NotFound',
              Message: 'Order not found',
              Path: '',
              Url: '',
            },
          ],
        };
      }
      // Loop over NedbankVoucherStatus enum and check if the orderCreateReference is conttains the enum value
      for (const status in NedbankVoucherStatus) {
        if (orderCreateReference.includes(NedbankVoucherStatus[status])) {
          return {
            Data: {
              Transactions: {
                Voucher: {
                  Status: NedbankVoucherStatus[status],
                },
              },
            },
          };
        }
      }
    }
    return {
      Data: {
        Transactions: {
          Voucher: {
            Status: NedbankVoucherStatus.REDEEMED,
          },
        },
      },
    };
  }

  public async createOrder(
    createOrderPayload: NedbankCreateOrderMockPayload,
  ): Promise<Record<string, unknown>> {
    const { Data } = createOrderPayload;
    const { Initiation } = Data;

    // This error of max 30 chars is currently not in the integration tests
    // because it should never happen as paymentReference set using a combination of fields that should never exceed 30 characters
    // However this if statement is here to catch any potential future changes that might cause this error
    // So than the happy path test will fail
    if (
      Data.Initiation.CreditorAccount.Name.length > 30 ||
      Data.Initiation.DebtorAccount.Name.length > 30
    ) {
      return {
        Message: 'BUSINESS ERROR',
        Code: 'NB.APIM.Field.Invalid',
        Id: '1d3e3076-9e1c-4933-aa7f-69290941ec70',
        Errors: [
          {
            ErrorCode: 'NB.APIM.Field.Invalid',
            Message: 'Request Validation Error - Name is too long',
          },
        ],
      };
    }

    // Scenario  Incorrect DebtorAccount Identification
    if (
      !Initiation.DebtorAccount.Identification ||
      Data.Initiation.CreditorAccount.Identification.includes(
        NedbankMockNumber.failDebitorAccountIncorrect,
      )
    ) {
      return {
        Message: 'BUSINESS ERROR',
        Code: 'NB.APIM.Field.Invalid',
        Id: '1d3e3076-9e1c-4933-aa7f-69290941ec70',
        Errors: [
          {
            ErrorCode: 'NB.APIM.Field.Invalid',
            Message:
              'Request Validation Error - TPP account configuration mismatch',
            Path: '',
            Url: '',
          },
        ],
      };
    }
    if (
      Data.Initiation.CreditorAccount.Identification.includes(
        NedbankMockNumber.failTimoutSimulate,
      )
    ) {
      // Simulate a timeout error
      // This is not an actual timeout since testing an actual timeout would make our automated test runs slower
      // This is just a way to simulate the result of a timout error which would be that the order status would never be updated
      // TODO: discuss if we can find a more elegant way to simulate a timeout error
      if (
        Data.Initiation.CreditorAccount.Identification.includes(
          NedbankMockNumber.failTimoutSimulate,
        )
      ) {
        throw new HttpException(
          'Simulated timeout',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }
    }
    if (Number(Data.Initiation.InstructedAmount.Amount.slice(0, -3)) > 5000) {
      return {
        Message: 'BUSINESS ERROR',
        Code: 'NB.APIM.Field.Invalid',
        Id: '1d3e3076-9e1c-4933-aa7f-69290941ec70',
        Errors: [
          {
            ErrorCode: 'NB.APIM.Field.Invalid',
            Message: 'Request Validation Error - Instructed amount is invalid',
          },
        ],
      };
    }

    return {
      Data: {
        OrderStatus: NedbankVoucherStatus.PENDING,
      },
    };
  }
}
