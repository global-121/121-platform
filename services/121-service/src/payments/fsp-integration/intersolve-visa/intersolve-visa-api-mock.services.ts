/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
  IntersolveIssueTokenBodyDto,
  IntersolveIssueTokenResponseDataDto,
  IntersolveIssueTokenResponseDto,
  IntersolveIssueTokenResponseTokenDto,
} from './dto/intersolve-issue-token-response.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';

@Injectable()
export class IntersolveVisaApiMockService {
  public issueTokenMock(): IntersolveIssueTokenResponseDto {
    const response = new IntersolveIssueTokenResponseDto();
    response.body = new IntersolveIssueTokenBodyDto();
    response.body.data = new IntersolveIssueTokenResponseDataDto();
    response.body.data.token = new IntersolveIssueTokenResponseTokenDto();
    response.body.success = true;
    response.body.errors = [];
    response.body.code = 'string';
    response.body.correlationId = 'string';
    response.body.data.token.code = `tokencode-${uuid()}`;
    response.body.data.token.blocked = false;
    response.body.data.token.blockReasonCode = 'string';
    response.body.data.token.type = 'string';
    response.body.data.token.tier = 'string';
    response.body.data.token.brandTypeCode = 'string';
    response.body.data.token.expiresAt = '2023-02-08T14:36:05.816Z';
    response.body.data.token.status = 'string';
    response.body.data.token.holderId = 'string';
    response.body.data.token.balances = [
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
    response.body.data.token.assets = [
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
    response.statusCode = 200;

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
}
