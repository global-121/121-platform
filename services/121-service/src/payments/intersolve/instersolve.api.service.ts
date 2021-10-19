import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntersolveCancelResponse } from './dto/intersolve-cancel-response.dto';
import { IntersolveCancelTransactionByRefPosResponse } from './dto/intersolve-cancel-transaction-by-ref-pos-response.dto';
import { IntersolveGetCardResponse } from './dto/intersolve-get-card-response.dto';
import { IntersolveIssueCardResponse } from './dto/intersolve-issue-card-response.dto';
import { IntersolveResultCode } from './enum/intersolve-result-code.enum';
import { IntersolveSoapElements } from './enum/intersolve-soap.enum';
import { IntersolveMockService } from './instersolve.mock';
import { IntersolveRequestEntity } from './intersolve-request.entity';
import { SoapService } from './soap.service';

@Injectable()
export class IntersolveApiService {
  @InjectRepository(IntersolveRequestEntity)
  private readonly intersolveRequestRepository: Repository<
    IntersolveRequestEntity
  >;

  public constructor(
    private readonly soapService: SoapService,
    private intersolveMock: IntersolveMockService,
  ) {}

  // If we get one of these codes back from a cancel by refpos, stop cancelling
  private readonly stopCancelByRefposCodes = [
    IntersolveResultCode.Ok,
    IntersolveResultCode.InvalidOrUnknownRetailer,
    IntersolveResultCode.UnableToCancel,
  ];

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

    const intersolveRequest = new IntersolveRequestEntity();
    intersolveRequest.refPos = refPos;
    intersolveRequest.EAN = process.env.INTERSOLVE_EAN;
    intersolveRequest.value = amount;

    let result = new IntersolveIssueCardResponse();
    try {
      const responseBody = !!process.env.MOCK_INTERSOLVE
        ? await this.intersolveMock.post(payload)
        : await this.soapService.post(payload);

      result = {
        resultCode: responseBody.IssueCardResponse.ResultCode._text,
        resultDescription:
          responseBody.IssueCardResponse.ResultDescription._text,
        cardId: responseBody.IssueCardResponse.CardId?._text,
        pin: responseBody.IssueCardResponse.PIN?._text,
        balance: parseInt(responseBody.IssueCardResponse.CardNewBalance?._text),
        transactionId: responseBody.IssueCardResponse.TransactionId?._text,
      };

      intersolveRequest.resultCodeIssueCard = result.resultCode;
      intersolveRequest.cardId = result.cardId;
      intersolveRequest.PIN = parseInt(result.pin) || null;
      intersolveRequest.balance = result.balance || null;
      intersolveRequest.transactionId = parseInt(result.transactionId) || null;
      intersolveRequest.toCancel = result.resultCode != IntersolveResultCode.Ok;
    } catch (Error) {
      console.log('Error: ', Error);
      intersolveRequest.toCancel = true;
      result.resultDescription = Error;
    }
    await this.intersolveRequestRepository.save(intersolveRequest);
    return result;
  }

  public async getCard(
    cardId: string,
    pin: string,
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
      pin,
    );

    const responseBody = await this.soapService.post(payload);
    const result = {
      resultCode: responseBody.GetCardResponse.ResultCode._text,
      resultDescription: responseBody.GetCardResponse.ResultDescription._text,
      status: responseBody.GetCardResponse.Card?.Status?._text,
      balance: parseInt(responseBody.GetCardResponse.Card?.Balance?._text),
      balanceFactor: parseInt(
        responseBody.GetCardResponse.Card?.BalanceFactor?._text,
      ),
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
    intersolveRequest.updated = new Date();
    intersolveRequest.isCancelled =
      result.resultCode == IntersolveResultCode.Ok;
    intersolveRequest.cancellationAttempts =
      intersolveRequest.cancellationAttempts + 1;
    intersolveRequest.cancelByRefPosResultCode = result.resultCode;
    intersolveRequest.toCancel = !this.stopCancelByRefposCodes.includes(
      Number(result.resultCode),
    );
    await this.intersolveRequestRepository.save(intersolveRequest);
    return result;
  }

  public async cancel(
    cardId: string,
    transactionIdString: string,
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
      transactionIdString,
    );

    const responseBody = await this.soapService.post(payload);
    const result = {
      resultCode: responseBody.CancelResponse.ResultCode._text,
      resultDescription: responseBody.CancelResponse.ResultDescription._text,
    };
    const transactionId = Number(transactionIdString);
    const intersolveRequest = await this.intersolveRequestRepository.findOne({
      cardId,
      transactionId,
    });
    intersolveRequest.updated = new Date();
    intersolveRequest.isCancelled =
      result.resultCode == IntersolveResultCode.Ok;
    intersolveRequest.cancellationAttempts =
      intersolveRequest.cancellationAttempts + 1;
    intersolveRequest.cancelResultCode = result.resultCode;
    intersolveRequest.toCancel = !this.stopCancelByRefposCodes.includes(
      Number(result.resultCode),
    );
    await this.intersolveRequestRepository.save(intersolveRequest);

    return result;
  }
}
