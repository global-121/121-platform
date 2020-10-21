import { IntersolveGetCardResponse } from './dto/intersolve-get-card-response.dto';
import { SoapService } from './soap.service';
import { IntersolveIssueCardResponse } from './dto/intersolve-issue-card-response.dto';
import { Injectable } from '@nestjs/common';
import { IntersolveSoapElements } from './enum/intersolve-soap.enum';
import { IntersolveCancelTransactionByRefPosResponse } from './dto/intersolve-cancel-transaction-by-ref-pos-response.dto';
import { IntersolveCancelResponse } from './dto/intersolve-cancel-response.dto';

@Injectable()
export class IntersolveApiService {
  public constructor(private readonly soapService: SoapService) {}

  public async issueCard(
    amount: number,
    refPos: string,
  ): Promise<IntersolveIssueCardResponse> {
    console.log('issueCard soapService', this.soapService);
    let payload = await this.soapService.readXmlAsJs(
      IntersolveSoapElements.IssueCard,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.IssueCard,
      ['Value'],
      String(amount),
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
      refPos,
    );

    const responseBody = await this.soapService.post(payload);
    console.log('responseBody: ', responseBody);
    const result = {
      resultCode: responseBody.IssueCardResponse.ResultCode._text,
      resultDescription: responseBody.IssueCardResponse.ResultDescription._text,
      cardId: responseBody.IssueCardResponse.CardId._text,
      pin: parseInt(responseBody.IssueCardResponse.PIN._text),
      balance: parseInt(responseBody.IssueCardResponse.CardNewBalance._text),
      transactionId: parseInt(
        responseBody.IssueCardResponse.TransactionId._text,
      ),
    };
    return result;
  }

  public async getCard(
    cardId: string,
    pin: number,
  ): Promise<IntersolveGetCardResponse> {
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
      String(pin),
    );

    console.log('payload: ', payload);
    const responseBody = await this.soapService.post(payload);
    const result = {
      resultCode: responseBody.GetCardResponse.ResultCode._text,
      resultDescription: responseBody.GetCardResponse.ResultDescription._text,
      status: responseBody.GetCardResponse.Card.Status._text,
      balance: parseInt(responseBody.GetCardResponse.Card.Balance._text),
    };
    return result;
  }

  public async cancelTransactionByRefPos(
    cardId: string,
    refPos: string,
  ): Promise<IntersolveCancelTransactionByRefPosResponse> {
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
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.CancelTransactionByRefPos,
      ['CardId'],
      cardId,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.CancelTransactionByRefPos,
      ['RefPosToCancel'],
      refPos,
    );

    const responseBody = await this.soapService.post(payload);
    const result = {
      resultCode:
        responseBody.CancelTransactionByRefPosResponse.ResultCode._text,
      resultDescription:
        responseBody.CancelTransactionByRefPosResponse.ResultDescription._text,
    };
    return result;
  }

  public async cancel(
    cardId: string,
    transactionId: number,
  ): Promise<IntersolveCancelResponse> {
    let payload = await this.soapService.readXmlAsJs(
      IntersolveSoapElements.Cancel,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.Cancel,
      ['EAN'],
      process.env.INTERSOLVE_EAN,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.Cancel,
      ['CardId'],
      cardId,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveSoapElements.Cancel,
      ['TransactionId'],
      String(transactionId),
    );

    console.log('payload: ', payload);
    const responseBody = await this.soapService.post(payload);
    console.log('responseBody intersolve: ', responseBody);
    const result = {
      resultCode: responseBody.CancelResponse.ResultCode._text,
      resultDescription: responseBody.CancelResponse.ResultDescription._text,
    };
    console.log('result: ', result);
    return result;
  }
}
