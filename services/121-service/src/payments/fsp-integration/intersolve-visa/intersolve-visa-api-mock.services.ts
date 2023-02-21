/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { IntersolveActivateTokenResponseDto } from './dto/intersolve-activate-token-response.dto';
import { IntersolveCreateCustomerResponseBodyDto } from './dto/intersolve-create-customer-response.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import {
  IntersolveIssueTokenResponseBodyDto,
  IntersolveIssueTokenResponseDataDto,
  IntersolveIssueTokenResponseDto,
  IntersolveIssueTokenResponseTokenDto,
} from './dto/intersolve-issue-token-response.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';

@Injectable()
export class IntersolveVisaApiMockService {
  public issueTokenMock(): IntersolveIssueTokenResponseDto {
    const response = new IntersolveIssueTokenResponseDto();
    response.status = 200;
    response.statusText = 'OK';

    response.data = new IntersolveIssueTokenResponseBodyDto();
    response.data.success = true;
    response.data.errors = [];
    response.data.code = 'string';
    response.data.correlationId = 'string';

    response.data.data = new IntersolveIssueTokenResponseDataDto();
    response.data.data.token = new IntersolveIssueTokenResponseTokenDto();
    response.data.data.token.code = `mock-token-${uuid()}`;
    response.data.data.token.blocked = false;
    response.data.data.token.blockReasonCode = 'string';
    response.data.data.token.type = 'string';
    response.data.data.token.tier = 'string';
    response.data.data.token.brandTypeCode = 'string';
    response.data.data.token.expiresAt = '2023-02-08T14:36:05.816Z';
    response.data.data.token.status = 'string';
    response.data.data.token.holderId = 'string';
    response.data.data.token.balances = [
      {
        quantity: {
          assetCode: 'string',
          value: 0,
          reserved: 0,
        },
        discountBudgetValue: 0,
        lastChangedAt: '2023-02-08T14:36:05.816Z',
      },
    ];
    response.data.data.token.assets = [
      {
        identity: {
          type: 'string',
          subType: 'string',
          code: 'string',
        },
        groupCode: 'string',
        parentAssetCode: 'string',
        name: 'string',
        description: 'string',
        status: 'string',
        minorUnit: 0,
        tags: ['string'],
        expiresAt: '2023-02-08T14:36:05.816Z',
        conversions: [
          {
            toAssetCode: 'string',
            automatic: true,
            fromQuantity: 0,
            toQuantity: 0,
          },
        ],
        images: [
          {
            code: 'string',
            type: 'string',
            url: 'string',
            description: 'string',
          },
        ],
        vatRegulation: {
          code: 'string',
          value: 0,
        },
        termsAndConditions: {
          url: 'string',
          text: 'string',
        },
        amount: 0,
        currency: 'string',
        articleCode: 'string',
        percentage: 0,
        rank: 0,
        unit: 'string',
        promotionCode: 'string',
        ticket: 'string',
        chargeRestrictions: {
          product: {
            includes: ['string'],
            excludes: ['string'],
          },
          productGroup: {
            includes: ['string'],
            excludes: ['string'],
          },
        },
        allowedMethods: [
          {
            code: 'string',
            period: {
              start: '2023-02-08T14:36:05.817Z',
              end: '2023-02-08T14:36:05.817Z',
            },
            securityCodeInfo: {
              required: true,
              format: 'string',
            },
          },
        ],
      },
    ];

    return response;
  }

  public topUpCardMock(amountInCents: number): IntersolveLoadResponseDto {
    const response = {
      data: {
        success: true,
        errors: [],
        code: 'string',
        correlationId: 'string',
        data: {
          balances: [
            {
              quantity: {
                assetCode: 'string',
                value: 0,
                reserved: 0,
              },
              discountBudgetValue: 0,
              lastChangedAt: '2023-02-08T14:37:22.670Z',
            },
          ],
        },
      },
      status: 200,
      statusText: 'OK',
    };
    if (amountInCents === 9900) {
      response.data.success = false;
      response.data.errors.push({
        code: 'BALANCE_TOO_HIGH',
        field: 'mock field',
        description: 'We mocked a balance is too high',
      });
      response.status = 405;
      response.statusText = 'METHOD NOT ALLOWED';
    }
    return response;
  }

  public createIndividualMock(
    payload: IntersolveCreateCustomerDto,
  ): IntersolveCreateCustomerResponseBodyDto {
    const res = new IntersolveCreateCustomerResponseBodyDto();
    res.data = {
      success: true,
      errors: [],
      code: 'string',
      correlationId: 'string',
      data: {
        id: uuid(),
        externalReference: payload.externalReference,
        blocked: false,
        unblockable: false,
        createdAt: '2023-02-08T14:36:05.816Z',
      },
    };
    return res;
  }

  public registerHolderMock(): object {
    return {
      status: 204,
      statusText: 'No Content',
      data: {},
    };
  }

  public activateCardMock(): IntersolveActivateTokenResponseDto {
    const res = new IntersolveActivateTokenResponseDto();
    res.status = 200;
    res.statusText = 'OK';
    res.data = {
      success: true,
      errors: [],
      code: 'string',
      data: {},
    };
    return res;
  }
}
