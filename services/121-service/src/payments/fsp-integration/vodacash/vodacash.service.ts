import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import {
  ImportFspReconciliationArrayDto,
  ImportFspReconciliationDto,
} from '@121-service/src/payments/dto/import-fsp-reconciliation.dto';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';
import { Injectable } from '@nestjs/common';
import fs from 'fs';
import * as convert from 'xml-js';

@Injectable()
export class VodacashService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly fileImportService: FileImportService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FinancialServiceProviderName.vodacash;

    for (const payment of paymentList) {
      const paTransactionResult = {
        fspName: FinancialServiceProviderName.vodacash,
        referenceId: payment.referenceId,
        date: new Date(),
        calculatedAmount: payment.transactionAmount,
        status: StatusEnum.waiting,
        userId: payment.userId,
        message: null,
      };

      const transactionRelationDetails = {
        programId: programId,
        paymentNr: paymentNr,
        userId: payment.userId,
      };

      // Storing the per payment so you can continiously seed updates of transactions in Portal
      await this.transactionsService.storeTransactionUpdateStatus(
        paTransactionResult,
        transactionRelationDetails,
      );
    }
    return fspTransactionResult;
  }

  public async getFspInstructions(
    registration: RegistrationEntity,
    transaction: TransactionReturnDto,
    vodacashInstructionsXml?: string,
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
    if (phonenumber?.startsWith(drcCountrycode)) {
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

    const healthArea =
      await this.registrationDataService.getRegistrationDataValueByName(
        registration,
        'healthArea',
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
  ): ImportFspReconciliationArrayDto {
    const importRecord = new ImportFspReconciliationArrayDto();
    importRecord.status = this.getElementByName(row, 'Status').elements[0].text;
    if (importRecord.status === 'Completed') {
      const details = this.getElementByName(row, 'Details').elements;
      for (const row of details) {
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

  public async getRegistrationsForReconciliation(
    programId: number,
    payment: number,
  ) {
    const qb = this.registrationsPaginationService.getQueryBuilderForFsp(
      programId,
      payment,
      FinancialServiceProviderName.vodacash,
    );
    const chunkSize = 400000;
    return await this.registrationsPaginationService.getRegistrationsChunked(
      programId,
      {
        select: ['phoneNumber', 'referenceId', 'id'],
        path: '',
      },
      chunkSize,
      qb,
    );
  }

  public async findReconciliationRegistration(
    importRecord: ImportFspReconciliationArrayDto,
    registrations: Awaited<
      ReturnType<VodacashService['getRegistrationsForReconciliation']>
    >,
  ) {
    for (const registration of registrations) {
      if (importRecord.phoneNumber === registration.phoneNumber) {
        return registration;
      }
    }
  }

  public async createTransactionResult(
    registrationdId: number,
    referenceId: string,
    record: ImportFspReconciliationArrayDto,
    programId: number,
    payment: number,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.registrationId = registrationdId;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.fspName = FinancialServiceProviderName.vodacash;
    paTransactionResult.status = StatusEnum.error;
    paTransactionResult.calculatedAmount = (
      await this.transactionsService.getLastTransactions(
        programId,
        payment,
        referenceId,
      )
    )[0].amount;
    if (record) {
      // Vodacash reconciliation data only contains successful records
      paTransactionResult.status = StatusEnum.success;
      paTransactionResult.calculatedAmount = Number(record.amount);
    }
    return paTransactionResult;
  }

  private getElementByName(
    element: convert.Element | convert.ElementCompact,
    name: string,
  ): convert.Element | convert.ElementCompact {
    return element.elements.find((el) => el.name === name);
  }

  private async readXmlAsJs(path: string): Promise<any> {
    const xml = fs.readFileSync(path, 'utf-8');
    return convert.xml2js(xml);
  }

  private setValue(
    xml: any,
    elementName: string,
    attributeName: string,
    value: string | null,
  ): any {
    for (const el of xml.elements) {
      if (el.name === elementName) {
        el.attributes[attributeName] = value;
      }
    }
  }

  // This method is potentially generic, but since it does contain vodacash-specific code down the line, putting it here
  public async xmlToValidatedFspReconciliation(
    xmlFile,
  ): Promise<ImportFspReconciliationArrayDto[]> {
    const importRecords = await this.fileImportService.validateXml(xmlFile);
    return (await this.validateFspReconciliationXmlInput(importRecords))
      .validatedArray;
  }

  private async validateFspReconciliationXmlInput(
    xmlArray,
  ): Promise<ImportFspReconciliationDto> {
    const validatedArray: ImportFspReconciliationArrayDto[] = [];
    let recordsCount = 0;
    for (const row of xmlArray) {
      recordsCount += 1;
      if (this.fileImportService.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      const importRecord = this.validateReconciliationData(row);
      validatedArray.push(importRecord);
    }
    return {
      validatedArray,
      recordsCount,
    };
  }
}
