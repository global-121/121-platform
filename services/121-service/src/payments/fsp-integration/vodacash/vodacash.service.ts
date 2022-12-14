import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import fs from 'fs';
import { Repository } from 'typeorm';
import * as convert from 'xml-js';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { VodacashPaymentStatus } from './vodacash-payment-status';
import { VodacashReconciliationRow } from './vodacash-reconciliation-row';

@Injectable()
export class VodacashService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

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
        status: StatusEnum.waiting,
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
      const vodcashFormatPhonenumber = phonenumber.replace(drcCountrycode, '');
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

    const healthArea = await registration.getRegistrationDataValueByName(
      ' A. 5. Village/Quartier :  ',
    );
    this.setValue(vodcashInstructionCustomer, 'Comment', 'Value', healthArea);

    vodacashInstructions.elements[0].elements.push(vodcashInstructionCustomer);
    vodacashInstructionsXml = convert.js2xml(vodacashInstructions, {
      compact: false,
      fullTagEmptyElement: true,
      spaces: 2,
    });
    return vodacashInstructionsXml;
  }

  public validateReconciliationData(
    row: convert.Element | convert.ElementCompact,
  ): VodacashReconciliationRow {
    let importRecord = new VodacashReconciliationRow();
    importRecord.status = this.getElementByName(row, 'Status').elements[0].text;
    if (importRecord.status === 'Completed') {
      const details = this.getElementByName(row, 'Details').elements;
      for (const [i, row] of details.entries()) {
        const key = this.getElementByName(row, 'Key');
        if (key.elements[0].text === 'Amount') {
          importRecord.amount = this.getElementByName(
            row,
            'Value',
          ).elements[0].text;
        }
        if (key.elements[0].text === 'TransactionDetails') {
          importRecord.phoneNumber = this.getElementByName(
            row,
            'Value',
          ).elements[0].text.match(/[2][4][3][0-9]*/)[0];
        }
      }
    }
    return importRecord;
  }

  public async findRegistrationFromInput(
    row: VodacashReconciliationRow,
  ): Promise<RegistrationEntity> {
    return await this.registrationRepository.findOne({
      where: {
        phoneNumber: row.phoneNumber,
      },
    });
  }

  public async createTransactionResult(
    registration: RegistrationEntity,
    record: VodacashReconciliationRow,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.referenceId = registration.referenceId;
    paTransactionResult.status =
      record.status == VodacashPaymentStatus.Completed
        ? StatusEnum.success
        : StatusEnum.error;
    paTransactionResult.fspName = FspName.vodacash;
    paTransactionResult.message = record.status;
    paTransactionResult.calculatedAmount = Number(record.amount);
    return paTransactionResult;
  }

  private getElementByName(
    element: convert.Element | convert.ElementCompact,
    name: string,
  ): convert.Element | convert.ElementCompact {
    return element.elements.find(el => el.name === name);
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
