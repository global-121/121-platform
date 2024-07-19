import { CommercialBankEthiopiaMockService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.mock';
import { CommercialBankEthiopiaTransferPayload } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaSoapElements } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/enum/commercial-bank-ethiopia.enum';
import { SoapService } from '@121-service/src/utils/soap/soap.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CommercialBankEthiopiaApiService {
  public constructor(
    private readonly soapService: SoapService,
    private commercialBankEthiopiaMock: CommercialBankEthiopiaMockService,
  ) {}

  public async creditTransfer(
    payment: CommercialBankEthiopiaTransferPayload,
    credentials: { username: string; password: string },
  ): Promise<any> {
    const payload = await this.createCreditTransferPayload(
      payment,
      credentials,
    );

    try {
      const responseBody = !!process.env.MOCK_COMMERCIAL_BANK_ETHIOPIA
        ? await this.commercialBankEthiopiaMock.postCBETransfer(payment)
        : await this.soapService.postCBERequest(
            payload,
            `${process.env.COMMERCIAL_BANK_ETHIOPIA_URL}?xsd=4`,
          );

      if (
        responseBody.Status &&
        responseBody.Status.messages &&
        responseBody.Status.messages.length > 0 &&
        responseBody.Status.messages[0]._text.includes(
          'DUPLICATED Transaction!',
        )
      ) {
        const result = {
          resultDescription: 'Transaction is DUPLICATED',
        };
        return result;
      }

      return responseBody;
    } catch (error) {
      // Handle errors here
      let resultDescription: string | undefined;

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNABORTED') {
        console.error('Failed because of CBE connection error or timeout.');
        resultDescription =
          'Failed because of CBE connection error or timeout. Please try again later.';
      } else if (error.code === 'ENOENT') {
        console.error(
          'Failed because the certificate file is not found or not valid.',
        );
        resultDescription =
          'Failed because the certificate file is not found or not valid. Please contact 121 technical support.';
      } else {
        console.error('Unknown error occurred:', error.response);
        resultDescription =
          error.response ||
          'Failed because of an unknown error. Please contact 121 technical support.';
      }

      return { resultDescription };
    }
  }

  public async createCreditTransferPayload(
    payment: CommercialBankEthiopiaTransferPayload,
    credentials: { username: string; password: string },
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

  public async getTransactionStatus(
    payment: CommercialBankEthiopiaTransferPayload,
    credentials: { username: string; password: string },
  ): Promise<any> {
    const payload = await this.createTransactionStatusPayload(
      payment,
      credentials,
    );

    try {
      const responseBody = !!process.env.MOCK_COMMERCIAL_BANK_ETHIOPIA
        ? await this.commercialBankEthiopiaMock.postCBETransaction(payment)
        : await this.soapService.postCBERequest(
            payload,
            `${process.env.COMMERCIAL_BANK_ETHIOPIA_URL}?xsd=6`,
          );

      return responseBody;
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
      } else if (error.code === 'ENOENT') {
        console.error(
          'Failed because of ETHIOPIA_CERTIFICATE_PATH file or directory not found.',
        );
        result.resultDescription =
          'Failed because of ETHIOPIA_CERTIFICATE_PATH file or directory not found.';
      } else {
        console.error('Unknown error occurred:', error.response);
        result.resultDescription = error.response;
      }

      return result;
    }
  }

  public async createTransactionStatusPayload(
    payment: CommercialBankEthiopiaTransferPayload,
    credentials: { username: string; password: string },
  ): Promise<any> {
    // Create the SOAP envelope for credit transfer
    const payload = await this.soapService.readXmlAsJs(
      CommercialBankEthiopiaSoapElements.TransactionStatus,
    );

    // Find the soapenv:Body element
    const soapBody = payload.elements
      .find((el) => el.name === 'soapenv:Envelope')
      .elements.find((el) => el.name === 'soapenv:Body');

    // Find the cber:CBERemitanceTransactionStatus element
    const rmtFundtransfer = soapBody.elements.find(
      (el) => el.name === 'cber:CBERemitanceTransactionStatus',
    );

    // Modify the elements within cber:CBERemitanceTransactionStatus
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
        case 'ETXNSTATUSCBEREMITANCEType':
          const enquiryInputElement = element.elements.find(
            (el) => el.name === 'enquiryInputCollection',
          );
          const columnNameElement = enquiryInputElement.elements.find(
            (el) => el.name === 'columnName',
          );
          const criteriaValueElement = enquiryInputElement.elements.find(
            (el) => el.name === 'criteriaValue',
          );
          columnNameElement.elements[0].text = 'ID';
          criteriaValueElement.elements[0].text = payment.debitTheIrRef;
          // You can modify other elements similarly
          break;
        // Handle other elements if needed
      }
    });

    return payload;
  }

  public async getValidationStatus(
    bankAccountNumber: string,
    credentials: { username: string; password: string },
  ): Promise<any> {
    const payload = await this.createValidationStatusPayload(
      bankAccountNumber,
      credentials,
    );

    try {
      const responseBody = !!process.env.MOCK_COMMERCIAL_BANK_ETHIOPIA
        ? await this.commercialBankEthiopiaMock.postCBEValidation(payload)
        : await this.soapService.postCBERequest(
            payload,
            `${process.env.COMMERCIAL_BANK_ETHIOPIA_URL}?xsd=2`,
          );

      return responseBody;
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
      } else if (error.code === 'ENOENT') {
        console.error(
          'Failed because of ETHIOPIA_CERTIFICATE_PATH file or directory not found.',
        );
        result.resultDescription =
          'Failed because of ETHIOPIA_CERTIFICATE_PATH file or directory not found.';
      } else {
        console.error('Unknown error occurred:', error.response);
        result.resultDescription = error.response;
      }

      return result;
    }
  }

  public async createValidationStatusPayload(
    bankAccountNumber: string,
    credentials: { username: string; password: string },
  ): Promise<any> {
    // Create the SOAP envelope for credit transfer
    const payload = await this.soapService.readXmlAsJs(
      CommercialBankEthiopiaSoapElements.AccountEnquiry,
    );

    // Find the soapenv:Body element
    const soapBody = payload.elements
      .find((el) => el.name === 'soapenv:Envelope')
      .elements.find((el) => el.name === 'soapenv:Body');

    // Find the cber:AccountEnquiry element
    const rmtFundtransfer = soapBody.elements.find(
      (el) => el.name === 'cber:AccountEnquiry',
    );

    // Modify the elements within cber:AccountEnquiry
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
        case 'EACCOUNTCBEREMITANCEType':
          const enquiryInputElement = element.elements.find(
            (el) => el.name === 'enquiryInputCollection',
          );
          const columnNameElement = enquiryInputElement.elements.find(
            (el) => el.name === 'columnName',
          );
          const criteriaValueElement = enquiryInputElement.elements.find(
            (el) => el.name === 'criteriaValue',
          );
          columnNameElement.elements[0].text = 'ID';
          criteriaValueElement.elements[0].text = bankAccountNumber;
          // You can modify other elements similarly
          break;
        // Handle other elements if needed
      }
    });

    return payload;
  }
}
