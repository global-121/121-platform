import { Injectable } from '@nestjs/common';

import { IntersolveVoucherResultCode } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/enum/intersolve-voucher-result-code.enum';
import { waitForRandomDelay } from '@121-service/src/utils/waitFor.helper';

@Injectable()
export class IntersolveVoucherMockService {
  public async post(
    payload: any,
    username: string,
    password: string,
  ): Promise<any> {
    if (!username || !password) {
      throw new Error('Missing username or password in IntersolveVoucherMock');
    }

    await waitForRandomDelay(100, 300);
    const soapBody = payload.elements[0].elements.find(
      (e) => e.name === 'soap:Body',
    );
    const name = soapBody.elements[0].name;
    let response;
    if (name === 'GetCard') {
      response = {
        GetCardResponse: {
          ResultDescription: { _text: 'mock' },
          Card: {
            Balance: { _text: '125' },
            BalanceFactor: { _text: '10' },
            Status: { _text: 'mock' },
          },
          ResultCode: { _text: String(IntersolveVoucherResultCode.Ok) },
        },
      };
    } else {
      const missingParams = this.getMissingParamsIssueCard(payload);
      if (missingParams.length > 0) {
        throw new Error(
          `Missing required parameters in IntersolveVoucherMock: ${missingParams.join(', ')}`,
        );
      }

      const amount = soapBody.elements[0].elements.find(
        (e) => e.name === 'Value',
      ).elements[0].text;

      console.log('IntersolveMock: post(): ', 'payload:', {
        name,
        amount,
      });
      const cardId =
        7000000000000000000 + this.getRandomInt(1000000000000, 9999999999999);
      const transactionId = this.getRandomInt(100000000, 999999999);
      const pin = this.getRandomInt(100000, 999999);
      const expiryDate = '2099-01-01';
      response = {
        IssueCardResponse: {
          _attributes: {
            xmlns: 'http://www.loyaltyinabox.com/giftcard_6_8/',
          },
          ResultCode: { _text: String(IntersolveVoucherResultCode.Ok) },
          ResultDescription: { _text: 'Ok' },
          CardId: { _text: String(cardId) },
          PIN: { _text: String(pin) },
          TransactionId: { _text: String(transactionId) },
          CardOldBalance: { _text: '0' },
          CardNewBalance: { _text: amount },
          BrandName: { _text: 'ExternalDev' },
          BusinessRules: { Reloadable: [Object], Refundable: [Object] },
          Disclaimer: { _text: 'This is a sample disclaimer.' },
          ExpiryDate: { _text: expiryDate },
        },
      };
    }
    return new Promise((resolve) => resolve(response));
  }

  private getRandomInt(min: number, max: number): number {
    return (
      Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
      Math.ceil(min)
    );
  }

  private extractSoapValues(payload: any): {
    amount: number | null;
    refPos: string | null;
  } {
    try {
      const soapEnvelope = payload.elements?.[0];
      if (!soapEnvelope || soapEnvelope.name !== 'soap:Envelope') {
        return { amount: null, refPos: null };
      }

      const soapBody = soapEnvelope.elements?.find(
        (element: any) => element.name === 'soap:Body',
      );

      if (!soapBody?.elements?.[0]) {
        return { amount: null, refPos: null };
      }

      const issueCardElement = soapBody.elements[0];
      if (issueCardElement.name !== 'IssueCard') {
        return { amount: null, refPos: null };
      }

      const amount = this.extractElementValue(
        issueCardElement.elements,
        'Value',
      );

      const transactionHeader = issueCardElement.elements?.find(
        (element: any) => element.name === 'TransactionHeader',
      );
      const refPos = transactionHeader
        ? this.extractElementValue(transactionHeader.elements, 'RefPos')
        : null;

      return {
        amount: amount ? parseInt(amount, 10) : null,
        refPos,
      };
    } catch (error) {
      console.warn('Error extracting SOAP values from payload:', error);
      return { amount: null, refPos: null };
    }
  }

  private extractElementValue(
    elements: any[],
    elementName: string,
  ): string | null {
    const element = elements?.find((el: any) => el.name === elementName);
    return element?.elements?.[0]?.text || null;
  }

  private getMissingParamsIssueCard(payload: any): string[] {
    const { amount, refPos } = this.extractSoapValues(payload);
    const missingParams: string[] = [];
    if (!amount || String(amount).includes('${')) {
      missingParams.push('amount');
    }
    if (!refPos || String(refPos).includes('${')) {
      missingParams.push('refPos');
    }

    return missingParams;
  }
}
