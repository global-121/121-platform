/* eslint-disable @typescript-eslint/no-var-requires */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class IntersolveVisaApiMockService {
  public constructor(private readonly httpService: HttpService) {}

  public issueTokenMock(): any {
    const response = {
      body: {
        success: true,
        errors: [],
        code: 'string',
        correlationId: 'string',
        data: {
          token: {
            code: `tokencode-${uuid()}`,
            blocked: false,
            blockReasonCode: 'string',
            type: 'string',
            tier: 'string',
            brandTypeCode: 'string',
            expiresAt: '2023-02-08T14:36:05.816Z',
            status: 'string',
            holderId: 'string',
            balances: [
              {
                quantity: {
                  assetCode: 'string',
                  value: 0,
                  reserved: 0,
                },
                discountBudgetValue: 0,
                lastChangedAt: '2023-02-08T14:36:05.816Z',
              },
            ],
            assets: [
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
            ],
          },
        },
      },
      statusCode: 200,
    };
    return response;
  }

  public topUpCardMock(amountInCents: number): any {
    const response = {
      body: {
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
      statusCode: 200,
    };
    if (amountInCents === 9900) {
      response.body.success = false;
      response.body.errors.push({
        code: 'BALANCE_TOO_HIGH',
        field: 'mock field',
        description: 'We mocked a balance is too high',
      });
      response.statusCode = 405;
    }
    return response;
  }
}
