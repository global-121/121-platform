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
export class SeedMultipleNLRCDummy implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  public async run(
    squareRegistrationsString?: string,
    nrPaymentsString?: string,
    squareMessageString?: string,
  ): Promise<void> {
    const squareNumberRegistrations = Number(squareRegistrationsString) || 2;
    const nrPayments = Number(nrPaymentsString) || 2;
    const squareNumberBulkMessage = Number(squareMessageString) || 1;

    const min = 1;
    const maxSquareRegistration = 17;
    const maxSquareMessages = 6;
    const maxBulk = 30;
    if (
      isNaN(squareNumberRegistrations) ||
      squareNumberRegistrations < min ||
      squareNumberRegistrations > maxSquareRegistration
    ) {
      // Throw an error if "pageNumber" is not a valid number between 1 and 17.
      throw new HttpException(
        `dummySquareNumberRegistrations must be a number between ${min} and ${maxSquareRegistration}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (isNaN(nrPayments) || nrPayments < min || nrPayments > maxBulk) {
      // Throw an error if "pageNumber" is not a valid number between 1 and 17.
      throw new HttpException(
        `nrPayments must be a number between ${min} and ${maxBulk}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      isNaN(squareNumberBulkMessage) ||
      squareNumberBulkMessage < min ||
      squareNumberBulkMessage > maxSquareMessages
    ) {
      // Throw an error if "pageNumber" is not a valid number between 1 and 17.
      throw new HttpException(
        `squareNumberBulkMessage must be a number between ${min} and ${maxSquareMessages}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const seedMultiple = await new SeedMultipleNLRC(this.dataSource);
    await seedMultiple.run();

    // ************************
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
    await this.multiplyRegistrations(squareNumberRegistrations);
    await this.multiplyTransactions(nrPayments);
    await this.multiplyMessages(squareNumberBulkMessage);
  }

  private async multiplyRegistrations(square: number): Promise<void> {
    const queryRegistrations = readSqlFile(
      '../../src/scripts/sql/dummy-registrations.sql',
    );
    for (let i = 1; i <= square; i++) {
      console.log(
        `**CREATING DUMMY DATA square ${i} of ${square} registrations**`,
      );
      await this.dataSource.query(queryRegistrations);
    }
    const queryRegistrationData = readSqlFile(
      '../../src/scripts/sql/dummy-registration-data.sql',
    );
    for (let i = 1; i <= square; i++) {
      console.log(
        `**CREATING DUMMY DATA square ${i} of ${square} registration data**`,
      );
      await this.dataSource.query(queryRegistrationData);
    }

    const queryPhoneUnique = readSqlFile(
      '../../src/scripts/sql/dummy-make-phone-unique.sql',
    );
    console.log(`**CREATING DUMMY DATA making phoneNr unique**`);
    await this.dataSource.query(queryPhoneUnique);

    const queryTransactionsOnePerRegistration = readSqlFile(
      '../../src/scripts/sql/dummy-transations-one-per-registrations.sql',
    );
    for (let i = 1; i <= square; i++) {
      console.log(
        `**CREATING DUMMY DATA match transactions to registrations ${i} of ${square}**`,
      );
      await this.dataSource.query(queryTransactionsOnePerRegistration);
    }

    const queryMessagesOnePerRegistration = readSqlFile(
      '../../src/scripts/sql/dummy-messages-one-per-registration.sql',
    );
    for (let i = 1; i <= square; i++) {
      console.log(
        `**CREATING DUMMY DATA match messages to registrations ${i} of ${square}**`,
      );
      await this.dataSource.query(queryMessagesOnePerRegistration);
    }
  }

  private async multiplyTransactions(nr: number): Promise<void> {
    // Since there already is 1 transactions
    nr = nr - 1;
    const queryTransactions = readSqlFile(
      '../../src/scripts/sql/dummy-payment-transactions.sql',
    );
    for (let i = 1; i <= nr; i++) {
      console.log(
        `**CREATING DUMMY DATA payment ${i + 1} of ${nr + 1} payments**`,
      );
      await this.dataSource.query(queryTransactions, [i + 1, i]);
    }
  }

  private async multiplyMessages(nrSquare: number): Promise<void> {
    // Since there already is 1 transactions
    nrSquare = nrSquare - 1;
    const queryNrMessageBulk = readSqlFile(
      '../../src/scripts/sql/dummy-messages.sql',
    );
    for (let i = 1; i <= nrSquare; i++) {
      console.log(
        `**CREATING DUMMY DATA message ${i + 1} of ${
          nrSquare + 1
        } square messages**`,
      );
      await this.dataSource.query(queryNrMessageBulk);
    }
  }
}

export default SeedMultipleNLRC;
