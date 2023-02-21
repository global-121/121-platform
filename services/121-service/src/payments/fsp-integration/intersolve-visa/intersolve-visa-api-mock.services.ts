/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { IntersolveActivateTokenResponseDto } from './dto/intersolve-activate-token-response.dto';
import { IntersolveCreateCustomerResponseBodyDto } from './dto/intersolve-create-custom-respose.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import {
  IntersolveIssueTokenResponseDataDto,
  IntersolveIssueTokenResponseDto,
  IntersolveIssueTokenResponseTokenDto,
} from './dto/intersolve-issue-token-response.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';

@Injectable()
export class IntersolveVisaApiMockService {
  public issueTokenMock(): IntersolveIssueTokenResponseDto {
    const body = new IntersolveIssueTokenResponseDto();
    body.data = new IntersolveIssueTokenResponseDataDto();
    body.data.token = new IntersolveIssueTokenResponseTokenDto();
    body.success = true;
    body.errors = [];
    body.code = 'string';
    body.correlationId = 'string';
    body.data.token.code = `mock-token-${uuid()}`;
    body.data.token.blocked = false;
    body.data.token.blockReasonCode = 'string';
    body.data.token.type = 'string';
    body.data.token.tier = 'string';
    body.data.token.brandTypeCode = 'string';
    body.data.token.expiresAt = '2023-02-08T14:36:05.816Z';
    body.data.token.status = 'string';
    body.data.token.holderId = 'string';
    body.data.token.balances = [
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
    body.data.token.assets = [
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

    return body;
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
    return {};
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
