import { IntersolveCancelTransactionByRefPosResponse } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-cancel-transaction-by-ref-pos-response.dto';
import { IntersolveGetCardResponse } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-get-card-response.dto';
import { IntersolveIssueCardResponse } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-issue-card-response.dto';
import { IntersolveVoucherResultCode } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-result-code.enum';
import { IntersolveVoucherSoapElements } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-soap.enum';
import { IntersolveVoucherMockService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/instersolve-voucher.mock';
import { IntersolveIssueVoucherRequestEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-issue-voucher-request.entity';
import { SoapService } from '@121-service/src/utils/soap/soap.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class IntersolveVoucherApiService {
  @InjectRepository(IntersolveIssueVoucherRequestEntity)
  private readonly intersolveVoucherRequestRepo: Repository<IntersolveIssueVoucherRequestEntity>;

  public constructor(
    private readonly soapService: SoapService,
    private intersolveMock: IntersolveVoucherMockService,
  ) {}

  // If we get one of these codes back from a cancel by refpos, stop cancelling
  private readonly stopCancelByRefposCodes = [
    IntersolveVoucherResultCode.Ok,
    IntersolveVoucherResultCode.InvalidOrUnknownRetailer,
    IntersolveVoucherResultCode.UnableToCancel,
  ];

  public async issueCard(
    amount: number,
    refPos: number,
    username: string,
    password: string,
  ): Promise<IntersolveIssueCardResponse> {
    let payload = await this.soapService.readXmlAsJs(
      IntersolveVoucherSoapElements.IssueCard,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveVoucherSoapElements.IssueCard,
      ['Value'],
      String(amount),
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveVoucherSoapElements.IssueCard,
      ['EAN'],
      process.env.INTERSOLVE_EAN,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveVoucherSoapElements.IssueCard,
      ['TransactionHeader', 'RefPos'],
      String(refPos),
    );

    const intersolveRequest = new IntersolveIssueVoucherRequestEntity();
    intersolveRequest.refPos = refPos;
    intersolveRequest.EAN = process.env.INTERSOLVE_EAN;
    intersolveRequest.value = amount;

    let result = new IntersolveIssueCardResponse();
    try {
      const responseBody = !!process.env.MOCK_INTERSOLVE
        ? await this.intersolveMock.post(payload)
        : await this.soapService.post(
            payload,
            IntersolveVoucherSoapElements.LoyaltyHeader,
            username,
            password,
            process.env.INTERSOLVE_URL,
          );
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
      intersolveRequest.toCancel =
        result.resultCode != IntersolveVoucherResultCode.Ok;
    } catch (Error) {
      console.log('Error: ', Error);
      intersolveRequest.toCancel = true;
      result.resultDescription = Error;
    }
    await this.intersolveVoucherRequestRepo.save(intersolveRequest);
    return result;
  }

  public async getCard(
    cardId: string,
    pin: string,
    username: string,
    password: string,
  ): Promise<IntersolveGetCardResponse> {
    let payload = await this.soapService.readXmlAsJs(
      IntersolveVoucherSoapElements.GetCard,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveVoucherSoapElements.GetCard,
      ['CardId'],
      cardId,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveVoucherSoapElements.GetCard,
      ['PIN'],
      pin,
    );

    const responseBody = !!process.env.MOCK_INTERSOLVE
      ? await this.intersolveMock.post(payload)
      : await this.soapService.post(
          payload,
          IntersolveVoucherSoapElements.LoyaltyHeader,
          username,
          password,
          process.env.INTERSOLVE_URL,
        );
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

  public async markAsToCancelByRefPos(refPos: number): Promise<void> {
    const intersolveRequest = await this.intersolveVoucherRequestRepo.findOneBy(
      {
        refPos: refPos,
      },
    );
    intersolveRequest.updated = new Date();
    intersolveRequest.isCancelled = false;
    intersolveRequest.toCancel = true;
    await this.intersolveVoucherRequestRepo.save(intersolveRequest);
  }

  public async markAsToCancel(
    cardId: string,
    transactionIdString: string,
  ): Promise<void> {
    const transactionId = Number(transactionIdString);
    const intersolveRequest = await this.intersolveVoucherRequestRepo.findOneBy(
      {
        cardId: cardId,
        transactionId: transactionId,
      },
    );
    intersolveRequest.updated = new Date();
    intersolveRequest.isCancelled = false;
    intersolveRequest.toCancel = true;
    await this.intersolveVoucherRequestRepo.save(intersolveRequest);
  }

  public async cancelTransactionByRefPos(
    refPos: number,
    username: string,
    password: string,
  ): Promise<IntersolveCancelTransactionByRefPosResponse> {
    let payload = await this.soapService.readXmlAsJs(
      IntersolveVoucherSoapElements.CancelTransactionByRefPos,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveVoucherSoapElements.CancelTransactionByRefPos,
      ['EAN'],
      process.env.INTERSOLVE_EAN,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveVoucherSoapElements.CancelTransactionByRefPos,
      ['RefPosToCancel'],
      String(refPos),
    );

    const responseBody = await this.soapService.post(
      payload,
      IntersolveVoucherSoapElements.LoyaltyHeader,
      username,
      password,
      process.env.INTERSOLVE_URL,
    );
    const result = {
      resultCode:
        responseBody.CancelTransactionByRefPosResponse.ResultCode._text,
      resultDescription:
        responseBody.CancelTransactionByRefPosResponse.ResultDescription._text,
    };
    const intersolveRequest = await this.intersolveVoucherRequestRepo.findOneBy(
      {
        refPos: refPos,
      },
    );
    intersolveRequest.updated = new Date();
    intersolveRequest.isCancelled =
      result.resultCode == IntersolveVoucherResultCode.Ok;
    intersolveRequest.cancellationAttempts =
      intersolveRequest.cancellationAttempts + 1;
    intersolveRequest.cancelByRefPosResultCode = result.resultCode;
    intersolveRequest.toCancel = !this.stopCancelByRefposCodes.includes(
      Number(result.resultCode),
    );
    await this.intersolveVoucherRequestRepo.save(intersolveRequest);
    return result;
  }
}
