import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

import { CommercialBankEthiopiaTransferPayload } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/dtos/commercial-bank-ethiopia-transfer-payload.dto';

@Injectable()
export class CommercialBankEthiopiaMockService {
  public async postCBETransfer(
    payment: CommercialBankEthiopiaTransferPayload,
  ): Promise<any> {
    //##TODO: await waitForRandomDelay(100, 300);

    const mockScenario = 'success'; // Set 'success' / 'duplicated' / 'other-failure' / 'no-response' to test the corresponding scenario

    // Define the success transaction Status object
    const successTransactionStatus = {
      transactionId: { _text: 'FT212435G2ZD' },
      messageId: {},
      successIndicator: { _text: 'Success' },
      application: { _text: 'FUNDS.TRANSFER' },
    };
    // Define the duplicated transaction Status object
    const duplicatedTransactionStatus = {
      transactionId: { _text: 'FT212435G2ZD' },
      messageId: {},
      successIndicator: { _text: 'T24Error' },
      application: { _text: 'FUNDS.TRANSFER' },
      messages: [
        { _text: 'Transaction with number is DUPLICATED Transaction!' },
      ],
    };
    // Define the duplicated transaction Status object
    const otherFailureStatus = {
      transactionId: { _text: 'FT212435G2ZD' },
      messageId: {},
      successIndicator: { _text: 'T24Error' },
      application: { _text: 'FUNDS.TRANSFER' },
      messages: [{ _text: 'Other failure' }],
    };

    // Switch between mock scenarios
    let Status;
    if (mockScenario === 'success') {
      Status = successTransactionStatus;
    } else if (mockScenario === 'duplicated') {
      Status = duplicatedTransactionStatus;
    } else if (mockScenario === 'other-failure') {
      Status = otherFailureStatus;
    } else if (mockScenario === 'no-response') {
      const errors = 'No response';
      throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const response = {
      Status,
      FUNDSTRANSFERType: {
        FUNDSTRANSFERType: { _text: 'FT21243423L4' },
        TRANSACTIONTYPE: { _text: 'AC' },
        DEBITACCTNO: { _text: '1000001046296' },
        CURRENCYMKTDR: { _text: '1' },
        DEBITCURRENCY: { _text: 'ETB' },
        DEBITAMOUNT: { _text: String(payment.debitAmount) },
        DEBITVALUEDATE: { _text: '20210831' },
        DEBITTHEIRREF: { _text: String(payment.debitTheirRef) },
        CREDITACCTNO: { _text: String(payment.creditAcctNo) },
        CURRENCYMKTCR: { _text: '1' },
        CREDITCURRENCY: { _text: String(payment.creditCurrency) },
        CREDITVALUEDATE: { _text: '20210831' },
        TREASURYRATE: { _text: '44.8261' },
        PROCESSINGDATE: { _text: '20210831' },
        gORDERINGCUST: { ORDERINGCUST: { _text: 'ANDI.1' } },
        CHARGECOMDISPLAY: { _text: 'NO' },
        COMMISSIONCODE: { _text: 'DEBIT PLUS CHARGES' },
        CHARGECODE: { _text: 'DEBIT PLUS CHARGES' },
        BASECURRENCY: { _text: 'USD' },
        PROFITCENTRECUST: { _text: '1000104000' },
        RETURNTODEPT: { _text: 'NO' },
        FEDFUNDS: { _text: 'NO' },
        POSITIONTYPE: { _text: 'TR' },
        AMOUNTDEBITED: { _text: 'USD1.00' },
        AMOUNTCREDITED: { _text: 'ETB44.83' },
        CUSTOMERRATE: { _text: '44.8261' },
        gDELIVERYOUTREF: {
          DELIVERYOUTREF: [
            { _text: 'D20221011895444018000-900.1.1 DEBIT ADVICE' },
            { _text: 'D20221011895444018001-910.2.1 CREDIT ADVICE' },
          ],
        },
        CREDITCOMPCODE: { _text: 'ET0011234' },
        DEBITCOMPCODE: { _text: 'ET0010202' },
        LOCAMTDEBITED: { _text: '44.83' },
        LOCAMTCREDITED: { _text: '44.83' },
        CUSTGROUPLEVEL: { _text: '99' },
        DEBITCUSTOMER: { _text: '1000104000' },
        CREDITCUSTOMER: { _text: '1025700373' },
        DRADVICEREQDYN: { _text: 'Y' },
        CRADVICEREQDYN: { _text: 'Y' },
        CHARGEDCUSTOMER: { _text: '1000104000' },
        TOTRECCOMM: { _text: '0' },
        TOTRECCOMMLCL: { _text: '0' },
        TOTRECCHG: { _text: '0' },
        TOTRECCHGLCL: { _text: '0' },
        RATEFIXING: { _text: 'NO' },
        TOTRECCHGCRCCY: { _text: '0' },
        TOTSNDCHGCRCCY: { _text: '0.00' },
        AUTHDATE: { _text: '20210831' },
        ROUNDTYPE: { _text: 'NATURAL' },
        gSTMTNOS: {
          STMTNOS: [
            { _text: '200088954440178.00' },
            { _text: '1-4' },
            { _text: 'ET0010202' },
            { _text: '200088954440178.01' },
            { _text: '1-2' },
            { _text: 'ET0011234' },
            { _text: '200088954440178.02' },
            { _text: '1-2' },
          ],
        },
        CURRNO: { _text: '1' },
        gINPUTTER: { INPUTTER: { _text: '89544_ANDI.1__OFS_GCS' } },
        gDATETIME: { DATETIME: { _text: '2210111109' } },
        AUTHORISER: { _text: '89544_ANDI.1_OFS_GCS' },
        COCODE: { _text: 'ET0010001' },
        DEPTCODE: { _text: '1' },
        REMNAME: { _text: String(payment.remitterName) },
        BENNME: { _text: String(payment.beneficiaryName) },
      },
    };
    return new Promise((resolve) => resolve(response));
  }

  public async postCBETransaction(payment): Promise<any> {
    // ##TODO: await waitForRandomDelay(100, 300);

    const response = {
      Status: {
        successIndicator: { _text: 'Success' },
      },
      ETXNSTATUSCBEREMITANCEType: {
        gETXNSTATUSCBEREMITANCEDetailType: {
          mETXNSTATUSCBEREMITANCEDetailType: {
            SENDERREFERENCE: { _text: String(payment.debitTheirRef) },
            TXNREFERENCE: { _text: 'FT21243423L4' },
            TXNAMOUNT: { _text: '' },
            TXNSTATUS: { _text: '' },
            CLEAREDBAL: { _text: 0 },
          },
        },
      },
    };
    return new Promise((resolve) => resolve(response));
  }

  public async postCBEValidation(payload): Promise<any> {
    const mockScenario = 'success'; // 'other-failure' / 'no-response' to test the corresponding scenario

    // Define the success transaction Status object
    const successTransactionStatus = {
      successIndicator: { _text: 'Success' },
    };
    // Define the other failure transaction Status object
    const otherFailureStatus = {
      successIndicator: { _text: 'T24Error' },
      messages: [{ _text: 'Other Test failure' }],
    };

    // Switch between mock scenarios
    let Status;
    if (mockScenario === 'success') {
      Status = successTransactionStatus;
    } else if (mockScenario === 'other-failure') {
      Status = otherFailureStatus;
    } else if (mockScenario === 'no-response') {
      const errors = 'No response';
      throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      throw new Error(`Unhandled mock scenario: ${mockScenario}`);
    }

    const bankAccountNumber =
      payload['soapenv:Envelope']?.['soapenv:Body']?.['cber:AccountEnquiry']
        ?.EACCOUNTCBEREMITANCEType?.enquiryInputCollection?.criteriaValue;

    // Construct the SOAP response in JSON format
    const response = {
      'S:Envelope': {
        _attributes: {
          'xmlns:S': 'http://schemas.xmlsoap.org/soap/envelope/',
        },
        'S:Body': {
          'ns10:AccountEnquiryResponse': {
            _attributes: {
              'xmlns:ns10': 'http://temenos.com/CBEREMITANCE',
              'xmlns:ns9':
                'http://temenos.com/FUNDSTRANSFEROT103SERIALFTHPOUTWARD',
              'xmlns:ns8': 'http://temenos.com/ESTTLMENTACCBEREMITANCE',
              'xmlns:ns7': 'http://temenos.com/FUNDSTRANSFERREMITANCELMTS',
              'xmlns:ns6': 'http://temenos.com/ETXNSTATUSCBEREMITANCE',
              'xmlns:ns5': 'http://temenos.com/EEXCHRATESCBEREMITANCE',
              'xmlns:ns4': 'http://temenos.com/EACCOUNTCBEREMITANCE',
              'xmlns:ns3': 'http://temenos.com/FUNDSTRANSFER',
              'xmlns:ns2': 'http://temenos.com/FUNDSTRANSFERCBEREMITANCE',
            },
            Status,
            EACCOUNTCBEREMITANCEType: {
              'ns4:gEACCOUNTCBEREMITANCEDetailType': {
                'ns4:mEACCOUNTCBEREMITANCEDetailType': {
                  'ns4:ACCOUNTNO': { _text: bankAccountNumber },
                  'ns4:CUSTOMERNAME': { _text: 'ANDUALEM MOHAMMED YIMER' },
                  'ns4:ACCOUNTSTATUS': { _text: 'CREDIT ALLOWED' },
                  'ns4:MOBILENO': { _text: '+251947940727' },
                },
              },
            },
          },
        },
      },
    };

    return response;
  }
}
