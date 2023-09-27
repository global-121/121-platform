import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { DataSource } from 'typeorm';
import { changePhase, doPayment } from '../../test/helpers/program.helper';
import {
  changePaStatus,
  importRegistrations,
} from '../../test/helpers/registration.helper';
import { getAccessToken } from '../../test/helpers/utility.helper';
import {
  amountVisa,
  referenceIdVisa,
  registrationVisa,
} from '../../test/visa-card/visa-card.data';
import { ProgramPhase } from '../shared/enum/program-phase.model';
import { InterfaceScript } from './scripts.module';
import SeedMultipleNLRC from './seed-multiple-nlrc';

const readSqlFile = (filepath: string): string => {
  return fs
    .readFileSync(path.join(__dirname, filepath))
    .toString()
    .replace(/\r?\n|\r/g, '');
};

@Injectable()
export class SeedMultipleNLRCMockData implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  public async run(
    powerNrRegistrationsString?: string,
    nrPaymentsString?: string,
    powerNrMessagesString?: string,
  ): Promise<void> {
    const powerNrRegistrations = Number(powerNrRegistrationsString) || 2;
    const nrPayments = Number(nrPaymentsString) || 2;
    const powerNrMessages = Number(powerNrMessagesString) || 1;

    const min = 1;
    const maxPowerNrRegistrations = 17;
    const maxPowerNrMessages = 6;
    const maxNrPayments = 30;
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
    const seedMultiple = new SeedMultipleNLRC(this.dataSource);
    await seedMultiple.run();

    // Set up 1 registration with 1 payment and 1 message
    // TODO: this uses helper functions from the API-test folder, move this to a shared location
    const programIdVisa = 3;
    const accessToken = await getAccessToken();
    await changePhase(
      programIdVisa,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await changePhase(programIdVisa, ProgramPhase.inclusion, accessToken);
    await changePhase(programIdVisa, ProgramPhase.payment, accessToken);
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await changePaStatus(
      programIdVisa,
      [referenceIdVisa],
      'include',
      accessToken,
    );
    await doPayment(
      programIdVisa,
      1,
      amountVisa,
      [referenceIdVisa],
      accessToken,
    );
    await new Promise((r) => setTimeout(r, 3000));

    // Blow up data given the parameters
    await this.multiplyRegistrations(powerNrRegistrations);
    await this.multiplyTransactions(nrPayments);
    await this.multiplyMessages(powerNrMessages);
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

    const queryVisaCustomerOnePerRegistration = readSqlFile(
      '../../src/scripts/sql/mock-visa-customers.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match Visa customers to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryVisaCustomerOnePerRegistration);
    }

    const queryVisaWalletsOnePerRegistration = readSqlFile(
      '../../src/scripts/sql/mock-visa-wallets.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match Visa wallets to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryVisaWalletsOnePerRegistration);
    }
  }

  private async multiplyTransactions(nr: number): Promise<void> {
    // Since there already is 1 transaction
    nr = nr - 1;
    const queryTransactions = readSqlFile(
      '../../src/scripts/sql/mock-payment-transactions.sql',
    );
    for (let i = 1; i <= nr; i++) {
      console.log(
        `**CREATING MOCK DATA payment ${i + 1} of ${nr + 1} payments**`,
      );
      await this.dataSource.query(queryTransactions, [i + 1, i]);
    }

    console.log(`**Updating payment count**`);
    const queryUpdatePaymentCount = readSqlFile(
      '../../src/scripts/sql/mock-update-payment-count.sql',
    );
    await this.dataSource.query(queryUpdatePaymentCount);

    console.log(`**Updating latest transactions**`);
    const queryUpdateLatestTransaction = readSqlFile(
      '../../src/scripts/sql/mock-payment-transactions.sql',
    );
    await this.dataSource.query(queryUpdateLatestTransaction);
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
  }
}

export default SeedMultipleNLRC;
