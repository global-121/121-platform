import { Injectable } from '@nestjs/common';
import { SoapService } from '../../../utils/soap/soap.service';
import { CommercialBankEthiopiaMockService } from './commercial-bank-ethiopia.mock';
import { CommercialBankEthiopiaResponse } from './dto/commercial-bank-ethiopia-response.dto';
import { CommercialBankEthiopiaSoapElements } from './enum/commercial-bank-ethiopia.enum';

@Injectable()
export class CommercialBankEthiopiaApiService {
  public constructor(
    private readonly soapService: SoapService,
    private commercialBankEthiopiaMock: CommercialBankEthiopiaMockService,
  ) {}

  public async creditTransfer(payment: any): Promise<any> {
    const mainElement = 'cber:RMTFundtransfer';
    // Create the SOAP envelope for credit transfer
    const payload = await this.soapService.readXmlAsJs(
      CommercialBankEthiopiaSoapElements.CreditTransfer,
    );

    this.soapService.changeSoapBody(
      payload,
      mainElement,
      ['DEBITAMOUNT'],
      String(payment.debitAmount),
    );
    this.soapService.changeSoapBody(
      payload,
      mainElement,
      ['DEBITTHEIRREF'],
      String(payment.debitTheIrRef),
    );
    this.soapService.changeSoapBody(
      payload,
      mainElement,
      ['CREDITACCTNO'],
      String(payment.creditAcctNo),
    );
    this.soapService.changeSoapBody(
      payload,
      mainElement,
      ['CREDITCURRENCY'],
      String(payment.creditCurrency),
    );
    this.soapService.changeSoapBody(
      payload,
      mainElement,
      ['RemitterName'],
      String(payment.remitterName),
    );
    this.soapService.changeSoapBody(
      payload,
      mainElement,
      ['BeneficiaryName'],
      String(payment.beneficiaryName),
    );

    try {
      const responseBody = !!process.env.MOCK_COMMERSIAL_BANK_ETHIOPIA
        ? await this.commercialBankEthiopiaMock.post(payload, payment)
        : await this.soapService.post(
            payload,
            CommercialBankEthiopiaSoapElements.CbeLoyaltyHeader,
            process.env.COMMERSIAL_BANK_ETHIOPIA_PASSWORD,
            process.env.COMMERSIAL_BANK_ETHIOPIA_USERNAME,
            process.env.COMMERSIAL_BANK_ETHIOPIA_URL,
          );

      console.log(responseBody, 'responseBody');
      // Map the response to the CommercialBankEthiopiaResponse DTO
      const result: CommercialBankEthiopiaResponse = {
        resultCode: responseBody.IssueCardResponse.ResultCode._text,
        resultDescription:
          responseBody.IssueCardResponse.ResultDescription._text,
        transactionId: responseBody.IssueCardResponse.TransactionId?._text,
        successIndicator:
          responseBody.IssueCardResponse.successIndicator?._text,
        FundsTtransferType:
          responseBody.IssueCardResponse.FUNDSTRANSFERType?._text,
        transactionType: responseBody.IssueCardResponse.TRANSACTIONTYPE?._text,
        debitAcctNo: responseBody.IssueCardResponse.DEBITACCTNO?._text,
        currencyMktDr: responseBody.IssueCardResponse.CURRENCYMKTDR?._text,
        debitCurrency: responseBody.IssueCardResponse.DEBITCURRENCY?._text,
        debitAmount: responseBody.IssueCardResponse.DEBITAMOUNT?._text,
        debitValueDate: responseBody.IssueCardResponse.DEBITVALUEDATE?._text,
        debitTheirRef: {
          reloadable:
            responseBody.IssueCardResponse.DEBITTHEIRREF?.Reloadable?.map(
              (item) => item._text,
            ) ?? [],
          refundable:
            responseBody.IssueCardResponse.DEBITTHEIRREF?.Refundable?.map(
              (item) => item._text,
            ) ?? [],
        },
        creditAcctNo: responseBody.IssueCardResponse.CREDITACCTNO?._text,
        currencyMktCr: responseBody.IssueCardResponse.CURRENCYMKTCR?._text,
        creditCurrency: responseBody.IssueCardResponse.CREDITCURRENCY?._text,
        creditValueDate: responseBody.IssueCardResponse.CREDITVALUEDATE?._text,
        treasuryRate: responseBody.IssueCardResponse.TREASURYRATE?._text,
        processingDate: responseBody.IssueCardResponse.PROCESSINGDATE?._text,
        gOrderingCust: {
          orderingCust:
            responseBody.IssueCardResponse.gORDERINGCUST?.ORDERINGCUST?._text,
        },
        chargeComDisplay:
          responseBody.IssueCardResponse.CHARGECOMDISPLAY?._text,
        commissionCode: responseBody.IssueCardResponse.COMMISSIONCODE?._text,
        chargeCode: responseBody.IssueCardResponse.CHARGECODE?._text,
        baseCurrency: responseBody.IssueCardResponse.BASECURRENCY?._text,
        profitCenterCust:
          responseBody.IssueCardResponse.PROFITCENTRECUST?._text,
        returnToDept: responseBody.IssueCardResponse.RETURNTODEPT?._text,
        fedFunds: responseBody.IssueCardResponse.FEDFUNDS?._text,
        positionType: responseBody.IssueCardResponse.POSITIONTYPE?._text,
        amountDebited: responseBody.IssueCardResponse.AMOUNTDEBITED?._text,
        amountCredited: responseBody.IssueCardResponse.AMOUNTCREDITED?._text,
        customerRate: responseBody.IssueCardResponse.CUSTOMERRATE?._text,
        gDeliveryOutRef: {
          deliveryOutRef:
            responseBody.IssueCardResponse.gDELIVERYOUTREF?.DELIVERYOUTREF?.map(
              (item) => item._text,
            ) ?? [],
        },
        creditCompCode: responseBody.IssueCardResponse.CREDITCOMPCODE?._text,
        debitCompCode: responseBody.IssueCardResponse.DEBITCOMPCODE?._text,
        locAmtDebited: responseBody.IssueCardResponse.LOCAMTDEBITED?._text,
        locAmtCredited: responseBody.IssueCardResponse.LOCAMTCREDITED?._text,
        custGroupLevel: responseBody.IssueCardResponse.CUSTGROUPLEVEL?._text,
        debitCustomer: responseBody.IssueCardResponse.DEBITCUSTOMER?._text,
        creditCustomer: responseBody.IssueCardResponse.CREDITCUSTOMER?._text,
        drAdviceReqDyn: responseBody.IssueCardResponse.DRADVICEREQDYN?._text,
        crAdviceReqDyn: responseBody.IssueCardResponse.CRADVICEREQDYN?._text,
        chargedCustomer: responseBody.IssueCardResponse.CHARGEDCUSTOMER?._text,
        totRecComm: responseBody.IssueCardResponse.TOTRECCOMM?._text,
        totRecCommLcl: responseBody.IssueCardResponse.TOTRECCOMMLCL?._text,
        totRecChg: responseBody.IssueCardResponse.TOTRECCHG?._text,
        totRecChgLcl: responseBody.IssueCardResponse.TOTRECCHGLCL?._text,
        rateFixing: responseBody.IssueCardResponse.RATEFIXING?._text,
        totRecChgCrCcy: responseBody.IssueCardResponse.TOTRECCHGCRCCY?._text,
        totSndChgCrCcy: responseBody.IssueCardResponse.TOTSNDCHGCRCCY?._text,
        authDate: responseBody.IssueCardResponse.AUTHDATE?._text,
        roundType: responseBody.IssueCardResponse.ROUNDTYPE?._text,
        gStmtNos: {
          stmtNos:
            responseBody.IssueCardResponse.gSTMTNOS?.STMTNOS?.map(
              (item) => item._text,
            ) ?? [],
        },
        currNo: responseBody.IssueCardResponse.CURRNO?._text,
        gInputter: {
          inputter: responseBody.IssueCardResponse.gINPUTTER?.INPUTTER?._text,
        },
        gDateTime: {
          dateTime: responseBody.IssueCardResponse.gDATETIME?.DATETIME?._text,
        },
        authoriser: responseBody.IssueCardResponse.AUTHORISER?._text,
        coCode: responseBody.IssueCardResponse.COCODE?._text,
        deptCode: responseBody.IssueCardResponse.DEPTCODE?._text,
        remName: responseBody.IssueCardResponse.REMNAME?._text,
        benName: responseBody.IssueCardResponse.BENNAME?._text,
      };

      return result;
    } catch (error) {
      // Handle errors here
      const result: any = {
        resultDescription: 'Unknown error occurred.',
      };

      if (error.code === 'ENOTFOUND') {
        console.error('Network error: The host could not be found.');
        result.resultDescription =
          'Network error: The host could not be found.';
      } else {
        console.error('Unknown error occurred:', error.response);
        result.resultDescription = error.response;
      }

      return result;
    }
  }

  // public async getCard(
  //   cardId: string,
  //   pin: string,
  //   username: string,
  //   password: string,
  // ): Promise<IntersolveGetCardResponse> {
  //   let payload = await this.soapService.readXmlAsJs(
  //     IntersolveVoucherSoapElements.GetCard,
  //   );
  //   payload = this.soapService.changeSoapBody(
  //     payload,
  //     IntersolveVoucherSoapElements.GetCard,
  //     ['CardId'],
  //     cardId,
  //   );
  //   payload = this.soapService.changeSoapBody(
  //     payload,
  //     IntersolveVoucherSoapElements.GetCard,
  //     ['PIN'],
  //     pin,
  //   );

  //   const responseBody = !!process.env.MOCK_INTERSOLVE
  //     ? await this.intersolveMock.post(payload)
  //     : await this.soapService.post(
  //         payload,
  //         IntersolveVoucherSoapElements.LoyaltyHeader,
  //         username,
  //         password,
  //         process.env.INTERSOLVE_URL,
  //       );
  //   const result = {
  //     resultCode: responseBody.GetCardResponse.ResultCode._text,
  //     resultDescription: responseBody.GetCardResponse.ResultDescription._text,
  //     status: responseBody.GetCardResponse.Card?.Status?._text,
  //     balance: parseInt(responseBody.GetCardResponse.Card?.Balance?._text),
  //     balanceFactor: parseInt(
  //       responseBody.GetCardResponse.Card?.BalanceFactor?._text,
  //     ),
  //   };
  //   return result;
  // }

  // public async markAsToCancelByRefPos(refPos: number): Promise<void> {
  //   const intersolveRequest = await this.intersolveVoucherRequestRepo.findOneBy(
  //     {
  //       refPos: refPos,
  //     },
  //   );
  //   intersolveRequest.updated = new Date();
  //   intersolveRequest.isCancelled = false;
  //   intersolveRequest.toCancel = true;
  //   await this.intersolveVoucherRequestRepo.save(intersolveRequest);
  // }

  // public async markAsToCancel(
  //   cardId: string,
  //   transactionIdString: string,
  // ): Promise<void> {
  //   const transactionId = Number(transactionIdString);
  //   const intersolveRequest = await this.intersolveVoucherRequestRepo.findOneBy(
  //     {
  //       cardId: cardId,
  //       transactionId: transactionId,
  //     },
  //   );
  //   intersolveRequest.updated = new Date();
  //   intersolveRequest.isCancelled = false;
  //   intersolveRequest.toCancel = true;
  //   await this.intersolveVoucherRequestRepo.save(intersolveRequest);
  // }

  // public async cancelTransactionByRefPos(
  //   refPos: number,
  //   username: string,
  //   password: string,
  // ): Promise<IntersolveCancelTransactionByRefPosResponse> {
  //   let payload = await this.soapService.readXmlAsJs(
  //     IntersolveVoucherSoapElements.CancelTransactionByRefPos,
  //   );
  //   payload = this.soapService.changeSoapBody(
  //     payload,
  //     IntersolveVoucherSoapElements.CancelTransactionByRefPos,
  //     ['EAN'],
  //     process.env.INTERSOLVE_EAN,
  //   );
  //   payload = this.soapService.changeSoapBody(
  //     payload,
  //     IntersolveVoucherSoapElements.CancelTransactionByRefPos,
  //     ['RefPosToCancel'],
  //     String(refPos),
  //   );

  //   const responseBody = await this.soapService.post(
  //     payload,
  //     IntersolveVoucherSoapElements.LoyaltyHeader,
  //     username,
  //     password,
  //     process.env.INTERSOLVE_URL,
  //   );
  //   const result = {
  //     resultCode:
  //       responseBody.CancelTransactionByRefPosResponse.ResultCode._text,
  //     resultDescription:
  //       responseBody.CancelTransactionByRefPosResponse.ResultDescription._text,
  //   };
  //   const intersolveRequest = await this.intersolveVoucherRequestRepo.findOneBy(
  //     {
  //       refPos: refPos,
  //     },
  //   );
  //   intersolveRequest.updated = new Date();
  //   intersolveRequest.isCancelled =
  //     result.resultCode == IntersolveVoucherResultCode.Ok;
  //   intersolveRequest.cancellationAttempts =
  //     intersolveRequest.cancellationAttempts + 1;
  //   intersolveRequest.cancelByRefPosResultCode = result.resultCode;
  //   intersolveRequest.toCancel = !this.stopCancelByRefposCodes.includes(
  //     Number(result.resultCode),
  //   );
  //   await this.intersolveVoucherRequestRepo.save(intersolveRequest);
  //   return result;
  // }
}
