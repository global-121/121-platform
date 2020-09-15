import { IntersolveGetCardResponse } from './dto/intersolve-get-card-response.dto';
import { SoapService } from './soap.service';
import { IntersolveIssueCardResponse } from './dto/intersolve-issue-card-response.dto';
import { INTERSOLVE } from './../../../tokens/intersolve';
import { Injectable } from '@nestjs/common';
import { IntersolveSoapElements } from './enum/intersolve-soap.enum';

@Injectable()
export class IntersolveApiService {
  public constructor(private readonly soapService: SoapService) {}

  public async test(): Promise<any> {
    const result = await this.issueCard(2500);
    const result2 = await this.getCard(result.cardId, result.pin);
  }
  public async issueCard(amount: number): Promise<IntersolveIssueCardResponse> {
    console.log('soapService', this.soapService);
    let payload = await this.soapService.readXmlAsJs(
      IntersolveSoapElements.IssueCard,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.IssueCard,
      'Value',
      amount.toString(),
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.IssueCard,
      'EAN',
      INTERSOLVE.ean,
    );

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
    console.log('soapService', this.soapService);
    let payload = await this.soapService.readXmlAsJs(
      IntersolveSoapElements.GetCard,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.GetCard,
      'CardId',
      cardId,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.GetCard,
      'PIN',
      pin.toString(),
    );

    const responseBody = await this.soapService.post(payload);
    console.log('responseBody: ', responseBody);
    const result = {
      status: responseBody.GetCardResponse.Card.Status._text,
      balance: parseInt(responseBody.GetCardResponse.Card.Balance._text),
    };
    console.log('result: ', result);
    return result;
  }
}
