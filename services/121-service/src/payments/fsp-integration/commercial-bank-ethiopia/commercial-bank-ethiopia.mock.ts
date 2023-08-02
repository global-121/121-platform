import { Injectable } from '@nestjs/common';

@Injectable()
export class CommercialBankEthiopiaMockService {
  public async waitForRandomDelay(): Promise<void> {
    const min = 100;
    const max = 300;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, randomNumber));
  }

  public async post(payload: any, payment): Promise<any> {
    await this.waitForRandomDelay();
    const response = {
      IssueCardResponse: {
        ResultCode: { _text: '000' },
        ResultDescription: { _text: 'Success' },
        TransactionId: { _text: 'FT21243423L4' },
        successIndicator: { _text: 'Success' },
        FUNDSTRANSFERType: { _text: 'FT21243423L4' },
        TRANSACTIONTYPE: { _text: 'AC' },
        DEBITACCTNO: { _text: '1000001046296' },
        CURRENCYMKTDR: { _text: '1' },
        DEBITCURRENCY: { _text: 'ETB' },
        DEBITAMOUNT: { _text: String(payment.DEBITAMOUNT) },
        DEBITVALUEDATE: { _text: '20210831' },
        DEBITTHEIRREF: { _text: String(payment.DEBITTHEIRREF) },
        CREDITACCTNO: { _text: String(payment.CREDITACCTNO) },
        CURRENCYMKTCR: { _text: '1' },
        CREDITCURRENCY: { _text: String(payment.CREDITCURRENCY) },
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
        REMNAME: { _text: String(payment.RemitterName) },
        BENNME: { _text: String(payment.BeneficiaryName) },
      },
    };
    console.log('CommercialBankEthiopiaMock post(): response:', response);
    return new Promise((resolve) => resolve(response));
  }

  // private getRandomInt(min: number, max: number): number {
  //   return (
  //     Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
  //     Math.ceil(min)
  //   );
  // }
}
