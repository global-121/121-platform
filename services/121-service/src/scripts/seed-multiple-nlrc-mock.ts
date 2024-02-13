import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { DataSource } from 'typeorm';
import { registrationAHWhatsapp } from '../../seed-data/mock/registration-pv.data';
import {
  amountVisa,
  registrationVisa,
} from '../../seed-data/mock/visa-card.data';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { ProgramPhase } from '../shared/enum/program-phase.enum';
import { AxiosCallsService } from '../utils/axios/axios-calls.service';
import { waitFor } from '../utils/waitFor.helper';
import { InterfaceScript } from './scripts.module';
import { SeedMockHelper } from './seed-mock-helpers';
import SeedMultipleNLRC from './seed-multiple-nlrc';

const readSqlFile = (filepath: string): string => {
  return fs
    .readFileSync(path.join(__dirname, filepath))
    .toString()
    .replace(/\r?\n|\r/g, ' ');
};

@Injectable()
export class SeedMultipleNLRCMockData implements InterfaceScript {
  public constructor(
    private dataSource: DataSource,
    private readonly seedMockHelper: SeedMockHelper,
    private axiosCallsService: AxiosCallsService,
    private seedMultipleNLRC: SeedMultipleNLRC,
  ) {}

  public async run(
    isApiTests?: boolean,
    powerNrRegistrationsString?: number,
    nrPaymentsString?: number,
    powerNrMessagesString?: number,
    mockPv = true,
    mockOcw = true,
  ): Promise<void> {
    const powerNrRegistrations = Number(powerNrRegistrationsString) || 2;
    const nrPayments = Number(nrPaymentsString) || 2;
    const powerNrMessages = Number(powerNrMessagesString) || 1;

    const min = 1;
    const maxPowerNrRegistrations = 17;
    const maxPowerNrMessages = 6;
    const maxNrPayments = 30; //
    if (
      isNaN(powerNrRegistrations) ||
      powerNrRegistrations < min ||
      powerNrRegistrations > maxPowerNrRegistrations
    ) {
      // Throw an error if "pageNumber" is not a valid number between 1 and 17.
      throw new HttpException(
        `mockPowerNumberRegistrations must be a number between ${min} and ${maxPowerNrRegistrations}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (isNaN(nrPayments) || nrPayments < min || nrPayments > maxNrPayments) {
      // Throw an error if "pageNumber" is not a valid number between 1 and 17.
      throw new HttpException(
        `nrPayments must be a number between ${min} and ${maxNrPayments}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      isNaN(powerNrMessages) ||
      powerNrMessages < min ||
      powerNrMessages > maxPowerNrMessages
    ) {
      // Throw an error if "pageNumber" is not a valid number between 1 and 17.
      throw new HttpException(
        `squareNumberBulkMessage must be a number between ${min} and ${maxPowerNrMessages}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // ************************

    // Set up instance and program
    await this.seedMultipleNLRC.run(isApiTests);

    // Set up 1 registration with 1 payment and 1 message
    if (mockOcw) {
      const programIdOcw = 3;
      await this.seedRegistrationForProgram(programIdOcw, registrationVisa);
    }
    if (mockPv) {
      const programIdPV = 2;
      await this.seedRegistrationForProgram(
        programIdPV,
        registrationAHWhatsapp,
      );
    }

    await waitFor(4_000);

    // Blow up data given the parameters
    await this.multiplyRegistrations(powerNrRegistrations);
    await this.multiplyTransactions(nrPayments);
    await this.multiplyMessages(powerNrMessages);
    await this.updateSequenceNumbers();
  }

  private async seedRegistrationForProgram(
    programId: number,
    registration: any,
  ): Promise<void> {
    const accessToken = await this.axiosCallsService.getAccessToken();
    await this.seedMockHelper.changePhase(
      programId,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await this.seedMockHelper.changePhase(
      programId,
      ProgramPhase.inclusion,
      accessToken,
    );
    await this.seedMockHelper.changePhase(
      programId,
      ProgramPhase.payment,
      accessToken,
    );
    await this.seedMockHelper.importRegistrations(
      programId,
      [registration],
      accessToken,
    );
    await this.seedMockHelper.awaitChangePaStatus(
      programId,
      [registration.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );

    const result = await this.seedMockHelper.doPayment(
      programId,
      1,
      amountVisa,
      [registration.referenceId],
      accessToken,
    );
    console.log('🚀 ~ SeedMultipleNLRCMockData ~ result:', result.data);
  }

  private async multiplyRegistrations(powerNr: number): Promise<void> {
    const queryRegistrations = readSqlFile(
      '../../src/scripts/sql/mock-registrations.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA registrations: duplication ${i} of ${powerNr} **`,
      );
      await this.dataSource.query(queryRegistrations);
    }
    const queryRegistrationData = readSqlFile(
      '../../src/scripts/sql/mock-registration-data.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA registration data: duplication ${i} of ${powerNr} **`,
      );
      await this.dataSource.query(queryRegistrationData);
    }

    const queryPhoneUnique = readSqlFile(
      '../../src/scripts/sql/mock-make-phone-unique.sql',
    );
    console.log(`**CREATING MOCK DATA making phoneNr unique**`);
    await this.dataSource.query(queryPhoneUnique);

    const queryTransactionsOnePerRegistration = readSqlFile(
      '../../src/scripts/sql/mock-transations-one-per-registrations.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match transactions to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryTransactionsOnePerRegistration);
    }

    const queryMessagesOnePerRegistration = readSqlFile(
      '../../src/scripts/sql/mock-messages-one-per-registration.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match messages to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryMessagesOnePerRegistration);
    }

    const queryAllVisaCustomers = readSqlFile(
      '../../src/scripts/sql/mock-visa-customers.sql',
    );
    console.log(`**CREATING MOCK DATA match Visa customers to registrations**`);
    await this.dataSource.query(queryAllVisaCustomers);

    const queryAllVisaWallets = readSqlFile(
      '../../src/scripts/sql/mock-visa-wallets.sql',
    );
    console.log(`**CREATING MOCK DATA match Visa wallets to registrations**`);
    await this.dataSource.query(queryAllVisaWallets);

    const queryDuplicateVouchers = readSqlFile(
      '../../src/scripts/sql/mock-intersolve-voucher.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match AH vouchers registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryDuplicateVouchers);
    }

    const queryDuplicateImageCodeExportVoucher = readSqlFile(
      '../../src/scripts/sql/mock-imagecode-export-vouchers.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match imagecode export vouchers to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryDuplicateImageCodeExportVoucher);
    }

    console.log(`**Updating voucher attributes**`);
    const queryUpdateVoucherAttributes = readSqlFile(
      '../../src/scripts/sql/mock-intersolve-voucher-attributes.sql',
    );
    await this.dataSource.query(queryUpdateVoucherAttributes);
    console.log(`**Done updating voucher attributes**`);
  }

  private async multiplyTransactions(nr: number): Promise<void> {
    // Since there already is 1 transaction
    nr = nr - 1;
    const queryTransactions = readSqlFile(
      '../../src/scripts/sql/mock-payment-transactions.sql',
    );
    const queryVoucherPerPayment = readSqlFile(
      '../../src/scripts/sql/mock-intersolve-voucher-per-payment.sql',
    );
    const queryImageCodeExportVoucherPerPayment = readSqlFile(
      '../../src/scripts/sql/mock-imagecode-export-vouchers-per-payment.sql',
    );
    for (let i = 1; i <= nr; i++) {
      console.log(
        `**CREATING MOCK DATA transactions payment ${i + 1} of ${
          nr + 1
        } payments**`,
      );
      await this.dataSource.query(queryTransactions, [i + 1, i]);
      console.log(
        `**CREATING MOCK DATA vouchers payment ${i + 1} of ${
          nr + 1
        } payments**`,
      );
      await this.dataSource.query(queryVoucherPerPayment, [i + 1, 1]);
      console.log(
        `**CREATING MOCK DATA imagecode payment ${i + 1} of ${
          nr + 1
        } payments**`,
      );
      await this.dataSource.query(queryImageCodeExportVoucherPerPayment);
    }

    console.log(`**Updating payment count**`);
    const queryUpdatePaymentCount = readSqlFile(
      '../../src/scripts/sql/mock-update-payment-count.sql',
    );
    await this.dataSource.query(queryUpdatePaymentCount);

    console.log(`**Updating latest transactions. This can take a minute..** `);
    await this.dataSource.query(
      `truncate table "121-service"."latest_transaction"`,
    );
    const queryUpdateLatestTransaction = readSqlFile(
      '../../src/scripts/sql/mock-latest-transactions.sql',
    );
    await this.dataSource.query(queryUpdateLatestTransaction);
    console.log(`**Done updating latest transactions**`);

    const queryUnusedVouchers = readSqlFile(
      '../../src/scripts/sql/mock-unused-vouchers.sql',
    );
    console.log(`**CREATING MOCK DATA unused vouchers**`);
    await this.dataSource.query(queryUnusedVouchers);
  }

  private async multiplyMessages(powerNr: number): Promise<void> {
    const queryNrMessageBulk = readSqlFile(
      '../../src/scripts/sql/mock-messages.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA messages: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryNrMessageBulk);
    }

    console.log(`**Updating latest messages. This can take a minute..** `);
    await this.dataSource.query(
      `truncate table "121-service"."latest_message"`,
    );
    const queryUpdateLatestMessage = readSqlFile(
      '../../src/scripts/sql/mock-latest-message.sql',
    );
    await this.dataSource.query(queryUpdateLatestMessage);
    console.log(`**Done updating latest message**`);
  }

  private async updateSequenceNumbers(): Promise<void> {
    console.log('**Updating sequence numbers.**');
    const tables = await this.dataSource.query(`
      SELECT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
      ON t.table_name = c.table_name
      AND t.table_schema = c.table_schema
      WHERE c.table_schema = '121-service'
      AND c.column_name = 'id'
      AND t.table_type = 'BASE TABLE'
    `);
    for (const table of tables) {
      const tableName = table.table_name;
      if (!['custom_migration', 'typeorm_metadata'].includes(tableName)) {
        const sequenceName = `${tableName}_id_seq`;
        const maxIdQuery = `SELECT MAX(id) FROM "121-service"."${tableName}"`;

        const maxIdResult = await this.dataSource.query(maxIdQuery);
        const maxId = maxIdResult[0].max;
        if (maxId && maxId > 0) {
          const nextId = maxId + 1;
          const updateSequenceQuery = `SELECT setval('121-service.${sequenceName}', ${nextId}) from "121-service"."${tableName}"`;
          await this.dataSource.query(updateSequenceQuery);
        }
      }
    }
  }
}

export default SeedMultipleNLRC;
