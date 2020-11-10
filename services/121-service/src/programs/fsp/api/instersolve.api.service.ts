import { IntersolveGetCardResponse } from './dto/intersolve-get-card-response.dto';
import { SoapService } from './soap.service';
import { IntersolveIssueCardResponse } from './dto/intersolve-issue-card-response.dto';
import { Injectable } from '@nestjs/common';
import { IntersolveSoapElements } from './enum/intersolve-soap.enum';
import { IntersolveCancelTransactionByRefPosResponse } from './dto/intersolve-cancel-transaction-by-ref-pos-response.dto';
import { IntersolveCancelResponse } from './dto/intersolve-cancel-response.dto';
import { IntersolveRequestEntity } from '../intersolve-request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntersolveResultCode } from './enum/intersolve-result-code.enum';

@Injectable()
export class IntersolveApiService {
  @InjectRepository(IntersolveRequestEntity)
  private readonly intersolveRequestRepository: Repository<
    IntersolveRequestEntity
  >;

  public constructor(private readonly soapService: SoapService) {}

  public async issueCard(
    amount: number,
    refPos: number,
  ): Promise<IntersolveIssueCardResponse> {
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
      String(refPos),
    );

    const responseBody = await this.soapService.post(payload);
    const result = {
      resultCode: responseBody.IssueCardResponse.ResultCode._text,
      resultDescription: responseBody.IssueCardResponse.ResultDescription._text,
      cardId: responseBody.IssueCardResponse.CardId?._text,
      pin: parseInt(responseBody.IssueCardResponse.PIN?._text),
      balance: parseInt(responseBody.IssueCardResponse.CardNewBalance?._text),
      transactionId: parseInt(
        responseBody.IssueCardResponse.TransactionId?._text,
      ),
    };

    const intersolveRequest = new IntersolveRequestEntity();
    intersolveRequest.refPos = refPos;
    intersolveRequest.EAN = Number(process.env.INTERSOLVE_EAN);
    intersolveRequest.value = amount;
    intersolveRequest.resultCodeIssueCard = result.resultCode;
    intersolveRequest.cardId = result.cardId;
    intersolveRequest.PIN = result.pin;
    intersolveRequest.balance = result.balance;
    intersolveRequest.transactionId = result.transactionId;
    await this.intersolveRequestRepository.save(intersolveRequest);

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
    refPos: number,
  ): Promise<IntersolveCancelTransactionByRefPosResponse> {
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
      ['RefPosToCancel'],
      String(refPos),
    );

    const responseBody = await this.soapService.post(payload);
    const result = {
      resultCode:
        responseBody.CancelTransactionByRefPosResponse.ResultCode._text,
      resultDescription:
        responseBody.CancelTransactionByRefPosResponse.ResultDescription._text,
    };

    const intersolveRequest = await this.intersolveRequestRepository.findOne({
      refPos,
    });
    intersolveRequest.updated = null;
    intersolveRequest.isCancelled =
      result.resultCode == IntersolveResultCode.Ok;
    intersolveRequest.cancellationAttempts =
      intersolveRequest.cancellationAttempts + 1;
    intersolveRequest.cancelByRefPosResultCode = result.resultCode;
    await this.intersolveRequestRepository.save(intersolveRequest);

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

    const responseBody = await this.soapService.post(payload);
    const result = {
      resultCode: responseBody.CancelResponse.ResultCode._text,
      resultDescription: responseBody.CancelResponse.ResultDescription._text,
    };

    const intersolveRequest = await this.intersolveRequestRepository.findOne({
      cardId,
      transactionId,
    });
    intersolveRequest.created = intersolveRequest.created;
    intersolveRequest.isCancelled =
      result.resultCode == IntersolveResultCode.Ok;
    intersolveRequest.cancellationAttempts =
      intersolveRequest.cancellationAttempts + 1;
    intersolveRequest.cancelResultCode = result.resultCode;
    await this.intersolveRequestRepository.save(intersolveRequest);

    return result;
  }
}
