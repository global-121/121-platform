/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { IntersolveActivateTokenResponseDto } from './dto/intersolve-activate-token-response.dto';
import {
  IntersolveCreateCustomerResponseBodyDto,
  IntersolveGetCustomerResponseBodyDto,
  IntersolveRegisterHolderResponseDto,
} from './dto/intersolve-create-customer-response.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import {
  IntersolveIssueTokenResponseBodyDto,
  IntersolveIssueTokenResponseDto,
  IntersolveIssueTokenResponseTokenDto,
} from './dto/intersolve-issue-token-response.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';
import { IntersolveVisaTokenStatus } from './enum/intersolve-visa-token-status.enum';

@Injectable()
export class IntersolveVisaApiMockService {
  public getCustomerMock(): IntersolveGetCustomerResponseBodyDto {
    const res = new IntersolveGetCustomerResponseBodyDto();
    res.data = {
      success: false, // This reflects the situation where no customer is found already, which is the happy flow
    };
    return res;
  }

  public createCustomerMock(
    payload: IntersolveCreateCustomerDto,
  ): IntersolveCreateCustomerResponseBodyDto {
    const res = new IntersolveCreateCustomerResponseBodyDto();
    res.data = {
      success: true,
      errors: [],
      code: 'string',
      correlationId: 'string',
      data: {
        id: `mock-${uuid()}`,
        externalReference: payload.externalReference,
        blocked: false,
        unblockable: false,
        createdAt: '2023-02-08T14:36:05.816Z',
      },
    };

    if (
      payload.individual.lastName.toLowerCase().includes('mock-fail-create')
    ) {
      res.data.success = false;
      res.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that creating customer failed',
      });
      res.status = 404;
      res.statusText = 'NOT_FOUND';
    }
    return res;
  }

  public registerHolderMock(tokenCode: string): object {
    const res: IntersolveRegisterHolderResponseDto = {
      status: 204,
      statusText: 'No Content',
      data: {},
    };
    if (tokenCode.toLowerCase().includes('mock-fail-register')) {
      res.data.success = false;
      res.data.errors = [];
      res.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that registering customer to token failed',
      });
      res.status = 404;
      res.statusText = 'NOT_FOUND';
    }
    return res;
  }

  public activateCardMock(
    tokenCode: string,
  ): IntersolveActivateTokenResponseDto {
    const res = new IntersolveActivateTokenResponseDto();
    res.status = 200;
    res.statusText = 'OK';
    res.data = {
      success: true,
      errors: [],
      code: 'string',
      data: {},
    };
    if (tokenCode.toLowerCase().includes('mock-fail-activate')) {
      res.data.success = false;
      res.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that activating token failed',
      });
      res.status = 404;
      res.statusText = 'NOT_FOUND';
    }
    return res;
  }

  public issueTokenMock(): IntersolveIssueTokenResponseDto {
    const response = new IntersolveIssueTokenResponseDto();
    response.status = 200;
    response.statusText = 'OK';

    response.data = new IntersolveIssueTokenResponseBodyDto();
    response.data.success = true;
    response.data.errors = [];
    response.data.code = 'string';
    response.data.correlationId = 'string';

    response.data.data = new IntersolveIssueTokenResponseTokenDto();
    response.data.data.code = `mock-token-${uuid()}`;
    response.data.data.blocked = false;
    response.data.data.blockReasonCode = 'string';
    response.data.data.type = 'string';
    response.data.data.tier = 'string';
    response.data.data.brandTypeCode = 'string';
    response.data.data.expiresAt = '2023-02-08T14:36:05.816Z';
    response.data.data.status = IntersolveVisaTokenStatus.ACTIVE;
    response.data.data.holderId = 'string';
    response.data.data.balances = [
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
    response.data.data.assets = [
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
    if (amountInCents === 99900) {
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
