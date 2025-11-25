import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { env } from '@121-service/src/env';
import { IntersolveCancelTransactionByRefPosResponse } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-cancel-transaction-by-ref-pos-response.dto';
import { IntersolveGetCardResponse } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-get-card-response.dto';
import { IntersolveIssueCardResponse } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-issue-card-response.dto';
import { IntersolveIssueVoucherRequestEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherResultCode } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-result-code.enum';
import { IntersolveVoucherSoapElements } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-soap.enum';
import { IntersolveGetCardSoapResponse } from '@121-service/src/payments/fsp-integration/intersolve-voucher/interfaces/intersolve-get-card-soap-response.interface';
import { IntersolveVoucherMockService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.mock';
import { repeatAttempt } from '@121-service/src/utils/repeat-attempt';
import { SoapService } from '@121-service/src/utils/soap/soap.service';

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
      env.INTERSOLVE_EAN,
    );
    payload = this.soapService.changeSoapBody(
      payload,
      IntersolveVoucherSoapElements.IssueCard,
      ['TransactionHeader', 'RefPos'],
      String(refPos),
    );

    const intersolveRequest = new IntersolveIssueVoucherRequestEntity();
    intersolveRequest.refPos = refPos;
    intersolveRequest.EAN = env.INTERSOLVE_EAN;
    intersolveRequest.value = amount;

    let result = new IntersolveIssueCardResponse();
    try {
      const responseBody = env.MOCK_INTERSOLVE
        ? await this.intersolveMock.post(payload, username, password)
        : await this.soapService.post(
            payload,
            IntersolveVoucherSoapElements.LoyaltyHeader,
            username,
            password,
            env.INTERSOLVE_URL,
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

    const withArgs = {
      payload,
      username,
      password,
    };
    const res = await repeatAttempt<
      typeof withArgs,
      IntersolveGetCardSoapResponse,
      string | undefined,
      string
    >({
      attemptTo: this.makeGetCardCall.bind(this),
      withArgs,
      processResponse: this.createErrorMessageIfRequestFailed.bind(this),
      isError: Boolean, // If processResponse returned a string, it's an error
      attemptsRemaining: 1, // retry once
    });

    const { success, error } = res;

    if (error) {
      throw new Error(error);
    }

    // TODO: use better typing to avoid this cast
    const responseBody = success as IntersolveGetCardSoapResponse;

    const result = {
      resultCode: responseBody.GetCardResponse!.ResultCode!._text,
      resultDescription: responseBody.GetCardResponse!.ResultDescription!._text,
      status: responseBody.GetCardResponse!.Card?.Status?._text ?? '',
      balance: parseInt(
        responseBody.GetCardResponse!.Card?.Balance?._text ?? '0',
      ),
      balanceFactor: parseInt(
        responseBody.GetCardResponse!.Card?.BalanceFactor?._text ?? '0',
      ),
    };
    return result;
  }

  private async makeGetCardCall({
    payload,
    username,
    password,
  }: {
    payload: any;
    username: string;
    password: string;
  }): Promise<IntersolveGetCardSoapResponse> {
    return env.MOCK_INTERSOLVE
      ? await this.intersolveMock.post(payload, username, password)
      : await this.soapService.post(
          payload,
          IntersolveVoucherSoapElements.LoyaltyHeader,
          username,
          password,
          env.INTERSOLVE_URL,
        );
  }

  private createErrorMessageIfRequestFailed(
    responseBody: IntersolveGetCardSoapResponse,
  ): string | undefined {
    if (!responseBody) {
      return 'Intersolve URL could not be reached.';
    }
    if (!responseBody.GetCardResponse) {
      return "Intersolve response did not contain a 'GetCardResponse' field.";
    }
    if (!responseBody.GetCardResponse.ResultCode) {
      return "Intersolve response did not contain a 'ResultCode' field.";
    }
    if (!responseBody.GetCardResponse.ResultDescription) {
      return "Intersolve response did not contain a 'ResultDescription' field.";
    }
    return undefined;
  }

  public async markAsToCancelByRefPos(refPos: number): Promise<void> {
    const intersolveRequest =
      await this.intersolveVoucherRequestRepo.findOneByOrFail({
        refPos,
      });
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
    const intersolveRequest =
      await this.intersolveVoucherRequestRepo.findOneByOrFail({
        cardId,
        transactionId,
      });
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
      env.INTERSOLVE_EAN,
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
      env.INTERSOLVE_URL,
    );
    const result = {
      resultCode:
        responseBody.CancelTransactionByRefPosResponse.ResultCode._text,
      resultDescription:
        responseBody.CancelTransactionByRefPosResponse.ResultDescription._text,
    };
    const intersolveRequest =
      await this.intersolveVoucherRequestRepo.findOneByOrFail({
        refPos,
      });
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
