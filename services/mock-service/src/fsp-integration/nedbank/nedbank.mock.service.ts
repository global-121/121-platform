import { Injectable } from '@nestjs/common';

import { NedbankCreateOrderMockPayload } from '@mock-service/src/fsp-integration/nedbank/nedbank.mock.controller';

export enum NedbankVoucherStatus { // Would be great if we could import this for the 121-service, unfortunately there is no easy way to do this yet.
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  REDEEMABLE = 'REDEEMABLE',
  REDEEMED = 'REDEEMED',
  REFUNDED = 'REFUNDED',
}

enum MockFailScenarios {
  failDebitorAccountIncorrect = 'failDebitorAccountIncorrect',
}

@Injectable()
export class NedbankMockService {
  public async getOrder(orderCreateReference: string): Promise<object> {
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

    // Scenario  Incorrect DebtorAccount Identification
    if (
      !Initiation.DebtorAccount.Identification ||
      Data.Initiation.CreditorAccount.Name.includes(
        MockFailScenarios.failDebitorAccountIncorrect,
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
    return {
      Data: {
        OrderStatus: NedbankVoucherStatus.PENDING,
      },
    };
  }
}
