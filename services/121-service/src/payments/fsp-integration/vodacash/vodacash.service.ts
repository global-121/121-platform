import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { VodacashApiService } from './vodacash.api.service';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { VodacashTransferPayload } from './vodacash-transfer-payload.dto';
import { VodacashRequestEntity } from './vodacash.request.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { TransactionEntity } from '../../transactions/transaction.entity';
import fs from 'fs';
import * as convert from 'xml-js';

@Injectable()
export class VodacashService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(VodacashRequestEntity)
  private readonly vodacashRequestRepository: Repository<VodacashRequestEntity>;

  public constructor(
    private readonly vodacashApiService: VodacashApiService,
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

    const program = await this.programRepository.findOne(programId);

    const authorizationToken = await this.vodacashApiService.authenticate();

    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const payload = this.createPayloadPerPa(
        payment,
        paymentNr,
        calculatedAmount,
        program.currency,
        program.id,
      );

      const paymentRequestResultPerPa = await this.sendPaymentPerPa(
        payload,
        payment.referenceId,
        authorizationToken,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
      // Storing the per payment so you can continiously seed updates of transactions in HO-Portal
      this.transactionsService.storeTransaction(
        paymentRequestResultPerPa,
        programId,
        paymentNr,
      );
    }

    return fspTransactionResult;
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    paymentNr: number,
    amount: number,
    currency: string,
    programId: number,
  ): VodacashTransferPayload {
    const payload = {
      amount: amount,
      to: `+${paymentData.paymentAddress}`,
      currency: currency,
      description: `121 program: payment ${paymentNr}`,
      tracenumber: `referenceId-${
        paymentData.referenceId
      }_program-${programId}_payment-${paymentNr}_timestamp-${+new Date()}`,
      referenceid: `referenceId-${
        paymentData.referenceId
      }_program-${programId}_payment-${paymentNr}_timestamp-${+new Date()}`,
      notifyto: true,
      notifyfrom: false,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: VodacashTransferPayload,
    referenceId: string,
    authorizationToken: string,
  ): Promise<PaTransactionResultDto> {
    // A timeout of 100ms to not overload vodacash server
    await new Promise(r => setTimeout(r, 2000));

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.vodacash;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.amount;

    const result = await this.vodacashApiService.transfer(
      payload,
      authorizationToken,
    );

    if ([200, 201].includes(result.status)) {
      paTransactionResult.status = StatusEnum.success;
    } else {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.data.error.message;
    }
    return paTransactionResult;
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

  public async readXmlAsJs(path: string): Promise<any> {
    const xml = fs.readFileSync(path, 'utf-8');
    return convert.xml2js(xml);
  }

  public setValue(
    xml,
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
