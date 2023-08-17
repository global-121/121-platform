import { Injectable } from '@nestjs/common';
import { SoapService } from '../../../utils/soap/soap.service';
import { CommercialBankEthiopiaMockService } from './commercial-bank-ethiopia.mock';
import { CommercialBankEthiopiaTransactionResponse } from './dto/commercial-bank-ethiopia-transaction-response.dto';
import { CommercialBankEthiopiaSoapElements } from './enum/commercial-bank-ethiopia.enum';

@Injectable()
export class CommercialBankEthiopiaApiService {
  public constructor(
    private readonly soapService: SoapService,
    private commercialBankEthiopiaMock: CommercialBankEthiopiaMockService,
  ) {}

  public async creditTransfer(payment: any, credentials): Promise<any> {
    console.log(credentials);
    const payload = await this.createCreditTransferBody(payment, credentials);

    try {
      const responseBody = !!process.env.MOCK_COMMERCIAL_BANK_ETHIOPIA
        ? await this.commercialBankEthiopiaMock.post(payload, payment)
        : await this.soapService.postCreate(
            payload,
            process.env.COMMERCIAL_BANK_ETHIOPIA_SOAPACTION_TRANSFER,
          );

      console.log(responseBody, 'responseBody');
      console.log(responseBody.Status.messages, 'messages');
      console.log(responseBody.Status.messages.length, 'messages length');
      console.log(
        responseBody.Status.messages[0]._text.includes(
          'DUPLICATED Transaction!',
        ),
        'DUPLICATED',
      );

      return responseBody;
    } catch (error) {
      console.log(error, 'creditTransfer');
      // Handle errors here
      const result: any = {
        resultDescription: 'Unknown error occurred.',
      };

      if (error.code === 'ENOTFOUND') {
        console.error(
          'Failed because of CBE connection error. Please try again later',
        );
        result.resultDescription =
          'Failed because of CBE connection error. Please try again later';
      } else {
        console.error('Unknown error occurred:', error.response);
        result.resultDescription = error.response;
      }

      return result;
    }
  }

  public async createCreditTransferBody(
    payment: any,
    credentials,
  ): Promise<any> {
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
          passwordElement.elements[0].text = credentials.password;
          userNameElement.elements[0].text = credentials.username;
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

  public async transactionStatus(payment: any, credentials): Promise<any> {
    const payload = await this.createtransactionStatusBody(
      payment,
      credentials,
    );

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
        console.error(
          'Failed because of CBE connection error. Please try again later',
        );
        result.resultDescription =
          'Failed because of CBE connection error. Please try again later';
      } else {
        console.error('Unknown error occurred:', error.response);
        result.resultDescription = error.response;
      }

      return result;
    }
  }

  public async createtransactionStatusBody(
    payment: any,
    credentials,
  ): Promise<any> {
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
          passwordElement.elements[0].text = credentials.password;
          userNameElement.elements[0].text = credentials.username;
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
