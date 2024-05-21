/* eslint-disable @typescript-eslint/no-var-requires */
import { IntersolveBlockWalletResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-block.dto';
import {
  IntersolveCreateCustomerResponseBodyDto,
  IntersolveLinkWalletCustomerResponseDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-customer-response.dto';
import { IntersolveCreateCustomerDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-customer.dto';
import { IntersolveCreateDebitCardResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-debit-card.dto';
import {
  IntersolveCreateWalletResponseBodyDto,
  IntersolveCreateWalletResponseDataDto,
  IntersolveCreateWalletResponseDto,
  IntersolveCreateWalletResponseTokenDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import { IntersolveGetCardResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-card-details.dto';
import { IntersolveGetWalletResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-details.dto';
import { GetTransactionsDetailsResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-transactions.dto';
import { IntersolveLoadResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-load-response.dto';
import {
  IntersolveVisaCardStatus,
  IntersolveVisaWalletStatus,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { waitForRandomDelay } from '@121-service/src/utils/waitFor.helper';
import { HttpStatus, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class IntersolveVisaApiMockService {
  public async createCustomerMock(
    payload: IntersolveCreateCustomerDto,
  ): Promise<IntersolveCreateCustomerResponseBodyDto> {
    await waitForRandomDelay(50, 100);
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
    const lastName = payload.individual.lastName
      ? payload.individual.lastName.toLowerCase()
      : '';

    if (lastName.includes('mock-fail-create-customer')) {
      res.data.success = false;
      res.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that creating customer failed',
      });
      res.status = 404;
      res.statusText = 'NOT_FOUND';
    }
    // in all below cases,pass different holderId to use in follow-up API-call (which does not take lastName as input)
    if (
      lastName.includes('mock-fail-create-wallet') ||
      lastName.includes('mock-fail-link-customer-wallet') ||
      lastName.includes('mock-fail-create-debit-card') ||
      lastName.includes('mock-fail-load-balance') ||
      lastName.includes('mock-fail-get-wallet') ||
      lastName.includes('mock-fail-get-card') ||
      lastName.includes('mock-spent') ||
      lastName.includes('mock-current-balance')
    ) {
      res.data.data.id = lastName;
    }
    return res;
  }

  public async createWalletMock(
    holderId: string,
  ): Promise<IntersolveCreateWalletResponseDto> {
    await waitForRandomDelay(50, 100);
    const response = new IntersolveCreateWalletResponseDto();
    response.status = 200;
    response.statusText = 'OK';

    response.data = new IntersolveCreateWalletResponseBodyDto();
    response.data.success = true;
    response.data.errors = [];
    response.data.code = 'string';
    response.data.correlationId = 'string';

    response.data.data = new IntersolveCreateWalletResponseDataDto();
    response.data.data.token = new IntersolveCreateWalletResponseTokenDto();
    response.data.data.token.code = `mock-token-${uuid()}`;
    response.data.data.token.blocked = false;
    response.data.data.token.blockReasonCode = 'string';
    response.data.data.token.tier = 'string';
    response.data.data.token.brandTypeCode = 'string';
    response.data.data.token.holderId = 'string';
    response.data.data.token.balances = [
      {
        quantity: {
          assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
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

    if (holderId.toLowerCase().includes('mock-fail-create-wallet')) {
      response.data.success = false;
      response.data.errors = [];
      response.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that creating wallet failed',
      });
      response.status = 404;
      response.statusText = 'NOT_FOUND';
    }
    // in all below cases,pass different tokenCode to use in follow-up API-call (which does not take holderId as input)
    // uuid is needed to not run into unqiue constraint on token code
    if (
      holderId.toLowerCase().includes('mock-fail-link-customer-wallet') ||
      holderId.toLowerCase().includes('mock-fail-create-debit-card') ||
      holderId.toLowerCase().includes('mock-fail-load-balance') ||
      holderId.toLowerCase().includes('mock-fail-get-wallet') ||
      holderId.toLowerCase().includes('mock-fail-get-card') ||
      holderId.toLowerCase().includes('mock-spent') ||
      holderId.toLowerCase().includes('mock-current-balance')
    ) {
      response.data.data.token.code = `${uuid()}${holderId}`;
    }

    return response;
  }

  public async linkCustomerToWalletMock(
    tokenCode: string,
  ): Promise<IntersolveLinkWalletCustomerResponseDto> {
    await waitForRandomDelay(50, 100);

    const res: IntersolveLinkWalletCustomerResponseDto = {
      status: HttpStatus.NO_CONTENT,
      statusText: 'No Content',
      data: {},
    };
    if (tokenCode.toLowerCase().includes('mock-fail-link-customer-wallet')) {
      res.data.success = false;
      res.data.errors = [];
      res.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that linking wallet to customer failed',
      });
      res.status = 404;
      res.statusText = 'NOT_FOUND';
    }
    return res;
  }

  public async createDebitCardMock(
    tokenCode: string,
  ): Promise<IntersolveCreateDebitCardResponseDto> {
    await waitForRandomDelay(50, 100);

    const res: IntersolveCreateDebitCardResponseDto = {
      status: HttpStatus.OK,
      statusText: 'OK',
      data: {},
    };
    if (tokenCode.toLowerCase().includes('mock-fail-create-debit-card')) {
      res.data.success = false;
      res.data.errors = [];
      res.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that creating debit card failed',
      });
      res.status = 404;
      res.statusText = 'NOT_FOUND';
    }
    return res;
  }

  public async loadBalanceCardMock(
    tokenCode: string,
  ): Promise<IntersolveLoadResponseDto> {
    await waitForRandomDelay(50, 100);

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
                assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
                value: 0,
                reserved: 0,
              },
              discountBudgetValue: 0,
              lastChangedAt: '2023-02-08T14:37:22.670Z',
            },
          ],
        },
      },
      status: HttpStatus.OK,
      statusText: 'OK',
    };
    if (tokenCode.toLowerCase().includes('mock-fail-load-balance')) {
      response.data.success = false;
      response.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that the load balance call failed',
      });
      response.status = 404;
      response.statusText = 'NOT FOUND';
    }
    return response;
  }

  public async unloadBalanceCardMock(): Promise<IntersolveLoadResponseDto> {
    return {
      data: {
        success: true,
        errors: [],
        code: 'string',
        correlationId: 'string',
        data: {
          balances: [
            {
              quantity: {
                assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
                value: 0, // return 0 because unload is only used to unload complete amount when re-issuing
                reserved: 0,
              },
              discountBudgetValue: 0,
              lastChangedAt: '2023-02-08T14:37:22.670Z',
            },
          ],
        },
      },
      status: HttpStatus.OK,
      statusText: 'OK',
    };
  }

  public async getWalletMock(
    tokenCode: string,
  ): Promise<IntersolveGetWalletResponseDto> {
    const match = tokenCode.match(/mock-current-balance-(\d+)/);
    let currentBalance;
    try {
      currentBalance = match ? parseInt(match[1], 10) : 2500;
    } catch (error) {
      currentBalance = 2500;
    }
    const response = new IntersolveGetWalletResponseDto();
    response.status = 200;
    response.data = {
      success: true,
      errors: [],
      code: 'string',
      correlationId: 'string',
      data: {
        code: 'string',
        status: IntersolveVisaWalletStatus.Active,
        balances: [
          {
            quantity: {
              assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
              value: currentBalance,
              reserved: 0,
            },
            discountBudgetValue: 0,
            lastChangedAt: new Date(
              new Date().setDate(new Date().getDate() - 7), // 7 days ago
            ).toISOString(),
          },
        ],
      },
    };

    if (tokenCode.toLowerCase().includes('mock-fail-get-wallet')) {
      response.data.success = false;
      response.data.errors.push({
        code: 'NOT_FOUND',
        field: 'mock field',
        description: 'We mocked that the get wallet call failed',
      });
      response.status = 404;
      response.statusText = 'NOT FOUND';
    }
    return response;
  }

  public async getCardMock(
    tokenCode: string,
  ): Promise<IntersolveGetCardResponseDto> {
    let returnStatus = IntersolveVisaCardStatus.CardOk;
    if (tokenCode.toLowerCase().includes('mock-fail-get-card')) {
      const substring = tokenCode.replace('mock-fail-get-card', '');
      for (const status of Object.values(IntersolveVisaCardStatus)) {
        if (substring.toLowerCase().includes(status.toLowerCase())) {
          returnStatus = status;
        }
      }
    }

    const response = new IntersolveGetCardResponseDto();
    response.status = 200;
    response.data = {
      success: true,
      errors: [],
      code: 'string',
      correlationId: 'string',
      data: {
        status: returnStatus,
        cardURL: 'string',
        cardFrameURL: 'string',
        accessToken: 'string',
      },
    };
    return response;
  }

  public getTransactionsMock(
    tokenCode: string,
  ): Promise<GetTransactionsDetailsResponseDto> {
    const response = new GetTransactionsDetailsResponseDto();
    response.status = 200;
    response.data = {
      code: 'string',
      correlationId: 'string',
      success: true,
      data: [
        {
          id: 1,
          quantity: {
            assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
            value: 3,
          },
          createdAt: new Date(
            new Date().setDate(new Date().getDate()),
          ).toISOString(),
          creditor: {
            tokenCode: 'random token code',
          },
          debtor: {
            tokenCode: tokenCode,
          },
          reference: 'string',
          type: 'CHARGE',
          description: 'string',
          location: {
            merchantCode: 'string',
            merchantLocationCode: 'string',
          },
          originalTransactionId: 1,
          paymentId: 1,
        },
      ],
    };
    if (tokenCode.toLowerCase().includes('mock-spent')) {
      // gets the numberic values from the token code after the mock-spent- string
      const match = tokenCode.match(/mock-spent-(\d+)/);
      let spentAmount;
      try {
        spentAmount = match ? parseInt(match[1], 10) : 0;
      } catch (error) {
        spentAmount = 200;
      }
      response.data.data.push({
        id: 1,
        quantity: {
          assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
          value: -spentAmount,
        },
        createdAt: new Date(
          new Date().setDate(new Date().getDate()),
        ).toISOString(),
        creditor: {
          tokenCode: 'random token code',
        },
        debtor: {
          tokenCode: tokenCode,
        },
        reference: 'string',
        type: 'RESERVATION',
        description: 'string',
        location: {
          merchantCode: 'string',
          merchantLocationCode: 'string',
        },
        originalTransactionId: 1,
        paymentId: 1,
      });

      response.data.data.push({
        id: 1,
        quantity: {
          assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
          value: -300,
        },
        createdAt: new Date(
          new Date().setMonth(new Date().getMonth() - 2),
        ).toISOString(),
        creditor: {
          tokenCode: 'random token code',
        },
        debtor: {
          tokenCode: tokenCode,
        },
        reference: 'string',
        type: 'RESERVATION',
        description: 'string',
        location: {
          merchantCode: 'string',
          merchantLocationCode: 'string',
        },
        originalTransactionId: 1,
        paymentId: 1,
      });
    }

    return Promise.resolve(response);
  }

  public async toggleBlockWalletMock(): Promise<IntersolveBlockWalletResponseDto> {
    await waitForRandomDelay(50, 100);

    // for the response it does not matter if it's blocked or unblocked
    const res: IntersolveBlockWalletResponseDto = {
      status: HttpStatus.NO_CONTENT,
      statusText: 'No Content',
      data: {},
    };
    return res;
  }

  public async activateWalletMock(
    tokenCode: string,
  ): Promise<IntersolveGetWalletResponseDto> {
    const response = new IntersolveGetWalletResponseDto();
    response.status = 200;
    response.data = {
      success: true,
      errors: [],
      code: 'string',
      correlationId: 'string',
      data: {
        code: tokenCode,
        status: IntersolveVisaWalletStatus.Active,
        balances: [
          {
            quantity: {
              assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
              value: 2500,
              reserved: 0,
            },
            discountBudgetValue: 0,
            lastChangedAt: new Date(
              new Date().setDate(new Date().getDate() - 7), // 7 days ago
            ).toISOString(),
          },
        ],
      },
    };
    return response;
  }

  public updateCustomerPhoneNumber(): any {
    return {
      status: HttpStatus.OK,
    };
  }

  public updateCustomerAddress(): any {
    return {
      status: HttpStatus.OK,
    };
  }
}
