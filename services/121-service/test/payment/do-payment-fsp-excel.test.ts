/* eslint-disable jest/no-conditional-expect */
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import { StatusEnum } from '../../src/shared/enum/status.enum';
import {
  changePhase,
  deleteFspConfiguration,
  doPayment,
  getFspConfiguration,
  getFspInstructions,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import {
  programIdWesteros,
  programIdWithValidation,
  registrationPV5,
  registrationWesteros1,
  registrationWesteros2,
} from '../registrations/pagination/pagination-data';

import programTest from '../../seed-data/program/program-test.json';

describe('Do payment with filter', () => {
  let accessToken: string;
  // Payment infor
  const amount = 10;
  const paymentNr = 1;

  // Registrations
  const registrationsWesteros = [registrationWesteros1, registrationWesteros2];
  const refrenceIdsWesteros = registrationsWesteros.map(
    (registration) => registration.referenceId,
  );
  const phoneNumbersWesteros = registrationsWesteros.map(
    (registration) => registration.phoneNumber,
  );

  const registraitonsProgramWithValidation = [registrationPV5];
  const refrenceIdsWithValidation = [registrationPV5.referenceId];

  beforeAll(async () => {
    await resetDB(SeedScript.testMultiple);
    accessToken = await getAccessToken();

    //////////////////////////
    // Setup Westeros program
    //////////////////////////
    await changePhase(programIdWesteros, ProgramPhase.payment, accessToken);

    await importRegistrations(
      programIdWesteros,
      registrationsWesteros,
      accessToken,
    );
    await awaitChangePaStatus(
      programIdWesteros,
      refrenceIdsWesteros,
      RegistrationStatusEnum.included,
      accessToken,
    );

    ////////////////////////////
    // Setup Validation program
    ////////////////////////////
    await changePhase(
      programIdWithValidation,
      ProgramPhase.payment,
      accessToken,
    );
    await importRegistrations(
      programIdWithValidation,
      registraitonsProgramWithValidation,
      accessToken,
    );
    await awaitChangePaStatus(
      programIdWithValidation,
      refrenceIdsWithValidation,
      RegistrationStatusEnum.included,
      accessToken,
    );

    await doPayment(programIdWesteros, paymentNr, amount, [], accessToken);

    await waitForPaymentTransactionsToComplete(
      programIdWesteros,
      refrenceIdsWesteros,
      accessToken,
      10_000,
      [StatusEnum.success],
    );

    // Create some extra mock data to see if the right amount of transactions are created
    await doPayment(
      programIdWithValidation,
      paymentNr,
      amount,
      [],
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdWithValidation,
      refrenceIdsWithValidation,
      accessToken,
      10_000,
    );
  });

  it('get fsp instruction with Excel/generic fsp return all specific columns that are set in "columnsToExport"', async () => {
    // Arrange
    const configValue = programTest.financialServiceProviders
      .find((fsp) => fsp.fsp === 'Excel')
      .configuration.find((c) => c.name === 'columnsToExport');
    const columns = JSON.parse(configValue.value).concat(['amount']);

    // Act
    const transactionsResponse = await getTransactions(
      programIdWesteros,
      paymentNr,
      null,
      accessToken,
    );

    const fspInstructionsResponse = await getFspInstructions(
      programIdWesteros,
      paymentNr,
      accessToken,
    );
    const fspInstructions = fspInstructionsResponse.body.data;

    // Assert
    // Check if transactions are successful
    for (const transaction of transactionsResponse.body) {
      expect(transaction.status).toBe(StatusEnum.success);
    }

    // Also check if the right amount of transactions are created
    expect(fspInstructions.length).toBe(refrenceIdsWesteros.length);

    // Also check if the right phonenumber are in the transactions
    expect(fspInstructions.map((r) => r.phoneNumber).sort()).toEqual(
      phoneNumbersWesteros.sort(),
    );

    // Check if the rows are created with the right values
    for (const row of fspInstructions) {
      const registration = registrationsWesteros.find(
        (r) => r.name === row.name,
      );
      for (const [key, value] of Object.entries(row)) {
        if (key === 'amount') {
          const multipliedAmount = amount * (registration.dragon + 1);
          expect(value).toBe(multipliedAmount);
        } else {
          expect(value).toEqual(String(registration[key]));
        }
      }
    }

    // Check if the right columns are exported
    const columnsInFspInstructions = Object.keys(fspInstructions[0]);
    expect(columnsInFspInstructions.sort()).toEqual(columns.sort());
  });

  it('get fsp instruction with Excel/generic fsp return all columns when "columnsToExport" is not set', async () => {
    // Arrange
    const programAttributeColumns = programTest.programCustomAttributes.map(
      (pa) => pa.name,
    );
    const programQuestionColumns = programTest.programQuestions.map(
      (pq) => pq.name,
    );
    const columns = programAttributeColumns
      .concat(programQuestionColumns)
      .concat(['amount']);

    const fspConfig = await getFspConfiguration(programIdWesteros, accessToken);
    const columnsToExport = fspConfig.body.find(
      (c) => c.name === 'columnsToExport',
    );
    await deleteFspConfiguration(
      programIdWesteros,
      columnsToExport.id,
      accessToken,
    );

    // Act
    const fspInstructionsResponse = await getFspInstructions(
      programIdWesteros,
      paymentNr,
      accessToken,
    );
    const fspInstructions = fspInstructionsResponse.body.data;

    const namesWesteros = registrationsWesteros.map((r) => r.name);
    // Also check if the right names are in the transactions
    expect(fspInstructions.map((r) => r.name).sort()).toEqual(
      namesWesteros.sort(),
    );

    // Check if the right columns are exported
    const columnsInFspInstructions = Object.keys(fspInstructions[0]);
    expect(columnsInFspInstructions.sort()).toEqual(columns.sort());

    // Assert if the values are correct
    for (const row of fspInstructions) {
      const registration = registrationsWesteros.find(
        (r) => r.name === row.name,
      );
      for (const [key, value] of Object.entries(row)) {
        if (key === 'amount') {
          const multipliedAmount = amount * (registration.dragon + 1);
          expect(value).toBe(multipliedAmount);
        } else {
          expect(value).toEqual(String(registration[key]));
        }
      }
    }
  });
});
