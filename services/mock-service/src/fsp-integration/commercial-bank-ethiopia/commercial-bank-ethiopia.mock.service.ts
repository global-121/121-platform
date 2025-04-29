import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

import { SoapPayload } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/interfaces/soap-payload.interface';

// Defining interfaces in this file because they are not used anywhere else
interface Status {
  successIndicator: { _text: string };
}

interface Envelope<T> {
  'S:Envelope': {
    _attributes: {
      'xmlns:S': string;
    };
    'S:Body': T;
  };
}

interface AccountEnquiryResponse {
  'ns10:AccountEnquiryResponse': {
    _attributes: Record<string, string>;
    Status: Status;
    EACCOUNTCBEREMITANCEType: {
      'ns4:gEACCOUNTCBEREMITANCEDetailType': {
        'ns4:mEACCOUNTCBEREMITANCEDetailType': {
          'ns4:ACCOUNTNO': { _text: string };
          'ns4:CUSTOMERNAME': { _text: string };
          'ns4:ACCOUNTSTATUS': { _text: string };
          'ns4:MOBILENO': { _text: string };
        };
      };
    };
  };
}

interface TransferCreditResponse {
  'ns10:RMTFundtransferResponse': {
    _attributes: Record<string, string>;
    Status: Status;
    FUNDSTRANSFERType: {
      _attributes: { id: string };
      'ns3:TRANSACTIONTYPE': { _text: string };
      'ns3:DEBITACCTNO': { _text: string };
      'ns3:CURRENCYMKTDR': { _text: string };
      'ns3:DEBITCURRENCY': { _text: string };
      'ns3:DEBITAMOUNT': { _text: string };
      'ns3:DEBITVALUEDATE': { _text: string };
      'ns3:DEBITTHEIRREF': { _text: string };
      'ns3:CREDITACCTNO': { _text: string };
      'ns3:CURRENCYMKTCR': { _text: string };
      'ns3:CREDITCURRENCY': { _text: string };
      'ns3:CREDITVALUEDATE': { _text: string };
      'ns3:TREASURYRATE': { _text: string };
      'ns3:PROCESSINGDATE': { _text: string };
      // Add other fields as needed
    };
  };
}

interface TransactionStatusEnquiryResponse {
  'ns10:CBERemitanceTransactionStatusResponse': {
    Status: Status;
    ETXNSTATUSCBEREMITANCEType: {
      'ns6:gETXNSTATUSCBEREMITANCEDetailType': {
        'ns6:mETXNSTATUSCBEREMITANCEDetailType': {
          'ns6:SENDERREFERENCE': { _text: string };
          'ns6:TXNREFERENCE': { _text: string };
          'ns6:TXNAMOUNT': Record<string, never>;
          'ns6:TXNSTATUS': Record<string, never>;
          'ns6:CLEAREDBAL': { _text: number };
        };
      };
    };
  };
}

@Injectable()
export class CommercialBankEthiopiaMockService {
  public async doAccountEnquiry(
    payload: SoapPayload<any>, // TODO: Define a more specific type for the payload
  ): Promise<Envelope<AccountEnquiryResponse>> {
    const Status = {
      successIndicator: { _text: 'Success' },
    };

    const bankAccountNumber: string =
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

  public async doTransferCredit(
    payload: SoapPayload<any>, // ## TODO: Use value from payload in response structure
  ): Promise<Envelope<TransferCreditResponse>> {
    // Extract values from the payload
    const debitAmount =
      payload['soapenv:Envelope']?.['soapenv:Body']?.['cber:RMTFundtransfer']?.[
        'FUNDSTRANSFERCBEREMITANCEType'
      ]?.['fun:DEBITAMOUNT']['_text'];
    const debitTheirRef =
      payload['soapenv:Envelope']?.['soapenv:Body']?.['cber:RMTFundtransfer']?.[
        'FUNDSTRANSFERCBEREMITANCEType'
      ]?.['fun:DEBITTHEIRREF']['_text'];
    const creditAcctNo =
      payload['soapenv:Envelope']?.['soapenv:Body']?.['cber:RMTFundtransfer']?.[
        'FUNDSTRANSFERCBEREMITANCEType'
      ]?.['fun:CREDITACCTNO']['_text'];
    const creditCurrency =
      payload['soapenv:Envelope']?.['soapenv:Body']?.['cber:RMTFundtransfer']?.[
        'FUNDSTRANSFERCBEREMITANCEType'
      ]?.['fun:CREDITCURRENCY']['_text'];
    const creditValueDate =
      payload['soapenv:Envelope']?.['soapenv:Body']?.['cber:RMTFundtransfer']?.[
        'FUNDSTRANSFERCBEREMITANCEType'
      ]?.['fun:CREDITVALUEDATE']['_text'];

    // Switch between mock scenarios based on Beneficiary Name from the payload
    const beneficiaryName =
      payload['soapenv:Envelope']?.['soapenv:Body']?.['cber:RMTFundtransfer']?.[
        'FUNDSTRANSFERCBEREMITANCEType'
      ]?.['fun:BeneficiaryName']['_text'];

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
        { _text: 'Transaction with number is DUPLICATED Transaction!' }, // It's needed here to add a second message to the array, because else our xml parser does not parse this as an array
      ],
    };
    // Define the error transaction Status object
    const errorStatus = {
      transactionId: { _text: 'FT212435G2ZD' },
      messageId: {},
      successIndicator: { _text: 'T24Error' },
      application: { _text: 'FUNDS.TRANSFER' },
      messages: [{ _text: 'Other failure' }],
    };

    let Status;
    if (debitTheirRef.includes('duplicate-')) {
      Status = duplicatedTransactionStatus;
    } else if (beneficiaryName === 'error') {
      Status = errorStatus;
    } else if (beneficiaryName === 'no-response') {
      const errors = 'No response';
      throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
    } else if (beneficiaryName === 'time-out') {
      return; // TODO: We mock a timeout here by not returning anything, which is not the best solution. However waiting on an actual timeout takes too long in the tests.
    } else {
      // If no specific mock scenario is provided, use the success scenario
      Status = successTransactionStatus;
    }

    const response = {
      'S:Envelope': {
        _attributes: {
          'xmlns:S': 'http://schemas.xmlsoap.org/soap/envelope/',
        },
        'S:Body': {
          'ns10:RMTFundtransferResponse': {
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
            FUNDSTRANSFERType: {
              _attributes: {
                id: 'FT21243423L4',
              },
              'ns3:TRANSACTIONTYPE': { _text: 'AC' },
              'ns3:DEBITACCTNO': { _text: '1000001046296' },
              'ns3:CURRENCYMKTDR': { _text: '1' },
              'ns3:DEBITCURRENCY': { _text: 'USD' },
              'ns3:DEBITAMOUNT': { _text: debitAmount },
              'ns3:DEBITVALUEDATE': { _text: '20210831' },
              'ns3:DEBITTHEIRREF': { _text: debitTheirRef },
              'ns3:CREDITACCTNO': { _text: creditAcctNo },
              'ns3:CURRENCYMKTCR': { _text: '1' },
              'ns3:CREDITCURRENCY': { _text: creditCurrency },
              'ns3:CREDITVALUEDATE': { _text: creditValueDate },
              'ns3:TREASURYRATE': { _text: '44.8261' },
              'ns3:PROCESSINGDATE': { _text: '20210831' },
              'ns3:gORDERINGCUST': {
                'ns3:ORDERINGCUST': { _text: 'ANDI.1' },
              },
              'ns3:CHARGECOMDISPLAY': { _text: 'NO' },
              'ns3:COMMISSIONCODE': { _text: 'DEBIT PLUS CHARGES' },
              'ns3:CHARGECODE': { _text: 'DEBIT PLUS CHARGES' },
              'ns3:BASECURRENCY': { _text: 'USD' },
              'ns3:PROFITCENTRECUST': { _text: '1000104000' },
              'ns3:RETURNTODEPT': { _text: 'NO' },
              'ns3:FEDFUNDS': { _text: 'NO' },
              'ns3:POSITIONTYPE': { _text: 'TR' },
              'ns3:AMOUNTDEBITED': { _text: 'USD1.00' },
              'ns3:AMOUNTCREDITED': { _text: 'ETB44.83' },
              'ns3:CUSTOMERRATE': { _text: '44.8261' },
              'ns3:gDELIVERYOUTREF': {
                'ns3:DELIVERYOUTREF': [
                  { _text: 'D20221011895444018000-900.1.1 DEBIT ADVICE' },
                  { _text: 'D20221011895444018001-910.2.1 CREDIT ADVICE' },
                ],
              },
              'ns3:CREDITCOMPCODE': { _text: 'ET0011234' },
              'ns3:DEBITCOMPCODE': { _text: 'ET0010202' },
              'ns3:LOCAMTDEBITED': { _text: '44.83' },
              'ns3:LOCAMTCREDITED': { _text: '44.83' },
              'ns3:CUSTGROUPLEVEL': { _text: '99' },
              'ns3:DEBITCUSTOMER': { _text: '1000104000' },
              'ns3:CREDITCUSTOMER': { _text: '1025700373' },
              'ns3:DRADVICEREQDYN': { _text: 'Y' },
              'ns3:CRADVICEREQDYN': { _text: 'Y' },
              'ns3:CHARGEDCUSTOMER': { _text: '1000104000' },
              'ns3:TOTRECCOMM': { _text: '0' },
              'ns3:TOTRECCOMMLCL': { _text: '0' },
              'ns3:TOTRECCHG': { _text: '0' },
              'ns3:TOTRECCHGLCL': { _text: '0' },
              'ns3:RATEFIXING': { _text: 'NO' },
              'ns3:TOTRECCHGCRCCY': { _text: '0' },
              'ns3:TOTSNDCHGCRCCY': { _text: '0.00' },
              'ns3:AUTHDATE': { _text: '20210831' },
              'ns3:ROUNDTYPE': { _text: 'NATURAL' },
              'ns3:gSTMTNOS': {
                'ns3:STMTNOS': [
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
              'ns3:CURRNO': { _text: '1' },
              'ns3:gINPUTTER': {
                'ns3:INPUTTER': { _text: '89544_ANDI.1__OFS_GCS' },
              },
              'ns3:gDATETIME': {
                'ns3:DATETIME': { _text: '2210111109' },
              },
              'ns3:AUTHORISER': { _text: '89544_ANDI.1_OFS_GCS' },
              'ns3:COCODE': { _text: 'ET0010001' },
              'ns3:DEPTCODE': { _text: '1' },
              'ns3:REMNAME': { _text: 'ANDUALE' },
              'ns3:BENNME': { _text: 'ABIY' },
            },
          },
        },
      },
    };
    return response;
  }

  public async doTransactionStatusEnquiry(
    _payload: SoapPayload<any>,
  ): Promise<Envelope<TransactionStatusEnquiryResponse>> {
    // TODO: Implement different scenarios: E.g. also a reponse when a transaction is not found or a transaction was created with an error
    const Status = {
      successIndicator: { _text: 'Success' },
    };

    const response = {
      'S:Envelope': {
        _attributes: {
          'xmlns:S': 'http://schemas.xmlsoap.org/soap/envelope/',
        },
        'S:Body': {
          'ns10:CBERemitanceTransactionStatusResponse': {
            Status,
            ETXNSTATUSCBEREMITANCEType: {
              'ns6:gETXNSTATUSCBEREMITANCEDetailType': {
                'ns6:mETXNSTATUSCBEREMITANCEDetailType': {
                  'ns6:SENDERREFERENCE': { _text: 'mock-sender-reference' },
                  'ns6:TXNREFERENCE': { _text: 'FT21243J7BTR' },
                  'ns6:TXNAMOUNT': {},
                  'ns6:TXNSTATUS': {},
                  'ns6:CLEAREDBAL': { _text: 0 },
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
