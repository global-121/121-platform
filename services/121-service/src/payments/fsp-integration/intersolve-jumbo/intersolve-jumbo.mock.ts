import { Injectable } from '@nestjs/common';
import { IntersolveJumboResultCode } from './enum/intersolve-jumbo-result-code.enum';

@Injectable()
export class IntersolveJumboMockService {
  public post(payload: any): Promise<any> {
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
          ResultCode: { _text: String(IntersolveJumboResultCode.Ok) },
        },
      };
    } else {
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
          ResultCode: { _text: String(IntersolveJumboResultCode.Ok) },
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
    console.log('IntersolveMock post(): response:', response);
    return new Promise((resolve) => resolve(response));
  }

  private getRandomInt(min: number, max: number): number {
    return (
      Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
      Math.ceil(min)
    );
  }
}
