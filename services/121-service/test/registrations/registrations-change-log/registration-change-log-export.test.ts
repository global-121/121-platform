import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { exportList } from '../../helpers/program.helper';
import {
  importRegistrations,
  updateRegistration,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import {
  referenceIdVisa,
  registrationVisa,
} from '../../../seed-data/mock/visa-card.data';

const reason1 = 'automated test 1';
const reason2 = 'automated test 2';
const programId = 3;
const registrationVisa2 = { ...registrationVisa };
registrationVisa2.referenceId = `${referenceIdVisa}2`;
registrationVisa2.firstName = 'Jack';

const dataUpdatePa1 = {
  phoneNumber: '15005550099', //changed value
};

const dataUpdatePa2 = {
  lastName: 'Snow', //changed value
  paymentAmountMultiplier: 2,
};

describe('Export registration change log', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(
      programId,
      [registrationVisa, registrationVisa2],
      accessToken,
    );

    await updateRegistration(
      programId,
      referenceIdVisa,
      dataUpdatePa1,
      reason1,
      accessToken,
    );

    await updateRegistration(
      programId,
      registrationVisa2.referenceId,
      dataUpdatePa2,
      reason2,
      accessToken,
    );
  });

  it('should keep a log of registration data changes', async () => {
    // Act
    const response = await exportList(
      programId,
      'pa-data-changes',
      accessToken,
    );

    // Assert
    const body = response.body;
    expect(response.statusCode).toBe(HttpStatus.OK);
    const fieldOrder = ['phoneNumber', 'lastName', 'paymentAmountMultiplier'];
    // Create a new array with the desired order
    const data = fieldOrder.map((fieldName) =>
      body.data.find((item) => item.fieldName === fieldName),
    );
    expect(data.length).toBe(3);
    const admin = 'admin@example.org';
    const checkingMap1 = {
      paId: 1,
      changedBy: admin,
      fullName: `${registrationVisa.firstName} ${registrationVisa.lastName}`,
      fieldName: 'phoneNumber',
      oldValue: registrationVisa.phoneNumber,
      newValue: dataUpdatePa1.phoneNumber,
      reason: reason1,
    };
    const checkingMap2 = {
      paId: 2,
      changedBy: admin,
      fullName: `${registrationVisa2.firstName} ${dataUpdatePa2.lastName}`,
      fieldName: 'lastName',
      oldValue: registrationVisa2.lastName,
      newValue: dataUpdatePa2.lastName,
      reason: reason2,
    };
    const checkingMap3 = {
      paId: 2,
      changedBy: admin,
      fullName: `${registrationVisa2.firstName} ${dataUpdatePa2.lastName}`,
      fieldName: 'paymentAmountMultiplier',
      oldValue: `${registrationVisa2.paymentAmountMultiplier}`,
      newValue: `${dataUpdatePa2.paymentAmountMultiplier}`,
      reason: reason2,
    };
    expect(data[0]).toMatchObject(checkingMap1);
    expect(data[1]).toMatchObject(checkingMap2);
    expect(data[2]).toMatchObject(checkingMap3);
  });

  it('should not return data changes for date range of 2-1 hour ago', async () => {
    // Act
    const response = await exportList(
      programId,
      'pa-data-changes',
      accessToken,
      new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    );

    // Assert
    const body = response.body;
    expect(response.statusCode).toBe(HttpStatus.OK);
    const data = body.data;
    expect(data.length).toBe(0);
  });

  it('should give a 400 on to date is larger than from date', async () => {
    // Act
    const response = await exportList(
      programId,
      'pa-data-changes',
      accessToken,
      new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });
});
