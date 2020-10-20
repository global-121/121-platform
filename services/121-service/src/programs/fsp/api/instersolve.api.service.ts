import { IntersolveGetCardResponse } from './dto/intersolve-get-card-response.dto';
import { SoapService } from './soap.service';
import { IntersolveIssueCardResponse } from './dto/intersolve-issue-card-response.dto';
import { Injectable } from '@nestjs/common';
import { IntersolveSoapElements } from './enum/intersolve-soap.enum';
import { IntersolveCancelTransactionByRefPosResponse } from './dto/intersolve-cancel-transaction-by-ref-pos-response.dto';

@Injectable()
export class IntersolveApiService {
  public constructor(private readonly soapService: SoapService) {}

  public async test(): Promise<any> {
    const resultIssueCard = await this.issueCard(2500);
    const resultGetCard = await this.getCard(
      resultIssueCard.cardId,
      resultIssueCard.pin,
    );
    const resultCancelTransactionByRefPosCard = await this.cancelTransactionByRefPos();
    const resultCancel = await this.cancel();
  }

  public async issueCard(amount: number): Promise<IntersolveIssueCardResponse> {
    console.log('issueCard soapService', this.soapService);
    let payload = await this.soapService.readXmlAsJs(
      IntersolveSoapElements.IssueCard,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.IssueCard,
      ['Value'],
      amount.toString(),
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.IssueCard,
      ['EAN'],
      process.env.INTERSOLVE_EAN,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.IssueCard,
      ['TransactionHeader', 'RefPos'],
      '121',
    );

    console.log('payload: ', payload);
    const responseBody = await this.soapService.post(payload);
    console.log('responseBody intersolve: ', responseBody);
    const result = {
      cardId: responseBody.IssueCardResponse.CardId._text,
      pin: parseInt(responseBody.IssueCardResponse.PIN._text),
      balance: parseInt(responseBody.IssueCardResponse.CardNewBalance._text),
    };
    console.log('result: ', result);
    return result;
  }

  public async getCard(
    cardId: string,
    pin: number,
  ): Promise<IntersolveGetCardResponse> {
    console.log('getCard soapService', this.soapService);
    let payload = await this.soapService.readXmlAsJs(
      IntersolveSoapElements.GetCard,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.GetCard,
      ['CardId'],
      cardId,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.GetCard,
      ['PIN'],
      pin.toString(),
    );

    console.log('payload: ', payload);
    const responseBody = await this.soapService.post(payload);
    console.log('responseBody: ', responseBody);
    const result = {
      status: responseBody.GetCardResponse.Card.Status._text,
      balance: parseInt(responseBody.GetCardResponse.Card.Balance._text),
    };
    console.log('result: ', result);
    return result;
  }

  public async cancelTransactionByRefPos(): Promise<
    IntersolveCancelTransactionByRefPosResponse
  > {
    console.log('cancelTransactionByRefPos soapService', this.soapService);
    let payload = await this.soapService.readXmlAsJs(
      IntersolveSoapElements.CancelTransactionByRefPos,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.CancelTransactionByRefPos,
      ['EAN'],
      process.env.INTERSOLVE_EAN,
    );

    console.log('payload: ', payload);
    const responseBody = await this.soapService.post(payload);
    console.log('responseBody intersolve: ', responseBody);
    const result = {
      resultCode: 1,
      resultDescription: '21',
    };
    console.log('result: ', result);
    return result;
  }

  public async cancel(): Promise<void> {
    console.log('gulfaraz called: ', IntersolveSoapElements.Cancel);
  }
}
