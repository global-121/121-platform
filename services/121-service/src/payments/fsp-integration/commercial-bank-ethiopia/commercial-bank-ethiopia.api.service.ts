import { Injectable } from '@nestjs/common';
import { SoapService } from '../../../utils/soap/soap.service';
import { CommercialBankEthiopiaMockService } from './commercial-bank-ethiopia.mock';
import { CommercialBankEthiopiaTransactionResponse } from './dto/commercial-bank-ethiopia-transaction-response.dto';
import { CommercialBankEthiopiaTransferResponse } from './dto/commercial-bank-ethiopia-transfer-response.dto';
import { CommercialBankEthiopiaSoapElements } from './enum/commercial-bank-ethiopia.enum';

@Injectable()
export class CommercialBankEthiopiaApiService {
  public constructor(
    private readonly soapService: SoapService,
    private commercialBankEthiopiaMock: CommercialBankEthiopiaMockService,
  ) {}

  public async creditTransfer(payment: any): Promise<any> {
    const payload = await this.createCreditTransferBody(payment);

    try {
      console.log(payment);
      console.log(JSON.stringify(payload));
      const responseBody = !!process.env.MOCK_COMMERCIAL_BANK_ETHIOPIA
        ? await this.commercialBankEthiopiaMock.post(payload, payment)
        : await this.soapService.postCreate(
            payload,
            process.env.COMMERCIAL_BANK_ETHIOPIA_SOAPACTION_TRANSFER,
          );

      console.log(responseBody, 'responseBody');
      // Map the response to the CommercialBankEthiopiaTransferResponse DTO
      const result: CommercialBankEthiopiaTransferResponse = {
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

  public async createCreditTransferBody(payment: any): Promise<any> {
    // Create the SOAP envelope for credit transfer
    const payload = await this.soapService.readXmlAsJs(
      CommercialBankEthiopiaSoapElements.CreditTransfer,
    );

    // Find the soapenv:Body element
    const soapBody = payload.elements
      .find((el) => el.name === 'soapenv:Envelope')
      .elements.find((el) => el.name === 'soapenv:Body');

    // Find the cber:RMTFundtransfer element
    const rmtFundtransfer = soapBody.elements.find(
      (el) => el.name === 'cber:RMTFundtransfer',
    );

    // Modify the elements within cber:RMTFundtransfer
    rmtFundtransfer.elements.forEach((element) => {
      switch (element.name) {
        case 'WebRequestCommon':
          const passwordElement = element.elements.find(
            (el) => el.name === 'password',
          );
          const userNameElement = element.elements.find(
            (el) => el.name === 'userName',
          );
          passwordElement.elements[0].text =
            process.env.COMMERCIAL_BANK_ETHIOPIA_PASSWORD;
          userNameElement.elements[0].text =
            process.env.COMMERCIAL_BANK_ETHIOPIA_USERNAME;
          break;
        case 'FUNDSTRANSFERCBEREMITANCEType':
          const debitAmountElement = element.elements.find(
            (el) => el.name === 'fun:DEBITAMOUNT',
          );
          const debitTheirRefElement = element.elements.find(
            (el) => el.name === 'fun:DEBITTHEIRREF',
          );
          const creditTheIrRefElement = element.elements.find(
            (el) => el.name === 'fun:CREDITTHEIRREF',
          );
          const creditAcctNoElement = element.elements.find(
            (el) => el.name === 'fun:CREDITACCTNO',
          );
          const creditCurrencyElement = element.elements.find(
            (el) => el.name === 'fun:CREDITCURRENCY',
          );
          const remitterNameElement = element.elements.find(
            (el) => el.name === 'fun:RemitterName',
          );
          const beneficiaryNameElement = element.elements.find(
            (el) => el.name === 'fun:BeneficiaryName',
          );

          debitAmountElement.elements[0].text = payment.debitAmount;
          debitTheirRefElement.elements[0].text = payment.debitTheIrRef;
          creditTheIrRefElement.elements[0].text = payment.creditTheIrRef;
          creditAcctNoElement.elements[0].text = payment.creditAcctNo;
          creditCurrencyElement.elements[0].text = payment.creditCurrency;
          remitterNameElement.elements[0].text = payment.remitterName;
          beneficiaryNameElement.elements[0].text = payment.beneficiaryName;

          // You can modify other elements similarly
          break;
        // Handle other elements if needed
      }
    });

    return payload;
  }

  public async transactionStatus(payment: any): Promise<any> {
    const payload = await this.createCreditTransferBody(payment);

    try {
      const responseBody = !!process.env.MOCK_COMMERCIAL_BANK_ETHIOPIA
        ? await this.commercialBankEthiopiaMock.post(payload, payment)
        : await this.soapService.postCreate(
            payload,
            process.env.COMMERCIAL_BANK_ETHIOPIA_SOAPACTION_TRANSACTION,
          );

      console.log(responseBody, 'responseBody');
      // Map the response to the CommercialBankEthiopiaTransactionResponse DTO
      const result: CommercialBankEthiopiaTransactionResponse = {
        resultCode: responseBody.IssueCardResponse.ResultCode._text,
        resultDescription:
          responseBody.IssueCardResponse.ResultDescription._text,
        senderReference: responseBody.IssueCardResponse.SENDERREFERENCE?._text,
        txnReference: responseBody.IssueCardResponse.TXNREFERENCE?._text,
        txnAmount: responseBody.IssueCardResponse.TXNAMOUNT?._text,
        clearEDBal: responseBody.IssueCardResponse.CLEAREDBAL?._text,
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

  public async createtransactionStatusBody(payment: any): Promise<any> {
    // Create the SOAP envelope for credit transfer
    const payload = await this.soapService.readXmlAsJs(
      CommercialBankEthiopiaSoapElements.TransactionStatus,
    );

    // Find the soapenv:Body element
    const soapBody = payload.elements
      .find((el) => el.name === 'soapenv:Envelope')
      .elements.find((el) => el.name === 'soapenv:Body');

    // Find the cber:SettlementAccount element
    const rmtFundtransfer = soapBody.elements.find(
      (el) => el.name === 'cber:SettlementAccount',
    );

    // Modify the elements within cber:SettlementAccount
    rmtFundtransfer.elements.forEach((element) => {
      switch (element.name) {
        case 'WebRequestCommon':
          const passwordElement = element.elements.find(
            (el) => el.name === 'password',
          );
          const userNameElement = element.elements.find(
            (el) => el.name === 'userName',
          );
          passwordElement.elements[0].text =
            process.env.COMMERCIAL_BANK_ETHIOPIA_PASSWORD;
          userNameElement.elements[0].text =
            process.env.COMMERCIAL_BANK_ETHIOPIA_USERNAME;
          break;
        case 'FUNDSTRANSFERCBEREMITANCEType':
          const debitTheirRefElement = element.elements.find(
            (el) => el.name === 'fun:DEBITTHEIRREF',
          );

          debitTheirRefElement.elements[0].text = payment.debitTheIrRef;

          // You can modify other elements similarly
          break;
        // Handle other elements if needed
      }
    });

    return payload;
  }
}
