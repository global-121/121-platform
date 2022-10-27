import { Injectable } from '@nestjs/common';
import fs from 'fs';
import * as convert from 'xml-js';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { FspTransactionResultDto } from '../../dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';

@Injectable()
export class VodacashService {
  public constructor(
    private readonly transactionsService: TransactionsService, // private readonly xmlService: XmLService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.vodacash;

    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);

      const paTransactionResult = {
        fspName: FspName.vodacash,
        referenceId: payment.referenceId,
        date: new Date(),
        calculatedAmount: calculatedAmount,
        status: StatusEnum.success,
        message: null,
      };

      // Storing the per payment so you can continiously seed updates of transactions in HO-Portal
      this.transactionsService.storeTransaction(
        paTransactionResult,
        programId,
        paymentNr,
      );
    }
    return fspTransactionResult;
  }

  public async getFspInstructions(
    registration: RegistrationEntity,
    transaction: TransactionEntity,
    vodacashInstructionsXml: string,
  ): Promise<any> {
    const locationBaseXml =
      './src/payments/fsp-integration/vodacash/xml/vodacash-base.xml';
    const locationCustomerXml =
      './src/payments/fsp-integration/vodacash/xml/vodacash-customer.xml';

    let vodacashInstructions;
    if (!vodacashInstructionsXml) {
      vodacashInstructions = await this.readXmlAsJs(locationBaseXml);
      vodacashInstructions.elements[0]['elements'] = [];
    } else {
      vodacashInstructions = convert.xml2js(vodacashInstructionsXml);
    }

    const vodcashInstructionCustomer = (
      await this.readXmlAsJs(locationCustomerXml)
    ).elements[0];

    const phonenumber = registration.phoneNumber;
    const drcCountrycode = '243';
    if (phonenumber.startsWith(drcCountrycode)) {
      const vodcashFormatPhonenumber = phonenumber.replace(drcCountrycode, '0');
      this.setValue(
        vodcashInstructionCustomer,
        'Identifier',
        'IdentifierValue',
        vodcashFormatPhonenumber,
      );
    }

    const amount = transaction.amount;
    this.setValue(
      vodcashInstructionCustomer,
      'Amount',
      'Value',
      String(amount),
    );
    vodacashInstructions.elements[0].elements.push(vodcashInstructionCustomer);
    vodacashInstructionsXml = convert.js2xml(vodacashInstructions, {
      compact: false,
      spaces: 4,
    });
    return vodacashInstructionsXml;
  }

  private async readXmlAsJs(path: string): Promise<any> {
    const xml = fs.readFileSync(path, 'utf-8');
    return convert.xml2js(xml);
  }

  private setValue(
    xml: any,
    elementName: string,
    attributeName: string,
    value: string,
  ): any {
    for (const el of xml.elements) {
      if (el.name === elementName) {
        el.attributes[attributeName] = value;
      }
    }
  }
}
