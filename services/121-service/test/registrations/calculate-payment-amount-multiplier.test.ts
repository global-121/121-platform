import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  projectIdWesteros,
  registrationPV5,
  registrationWesteros1,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Set/calculate payment amount multiplier', () => {
  let accessToken: string;

  beforeEach(async () => {
    accessToken = await getAccessToken();
  });

  it('should automatically calculate payment amount based on formula', async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    const nrOfDragons = 2;

    // Arrange
    const registrationWesterosCopy = { ...registrationWesteros1 };
    registrationWesterosCopy.dragon = nrOfDragons;

    // Act
    const responseImport = await importRegistrations(
      projectIdWesteros,
      [registrationWesterosCopy],
      accessToken,
    );
    const searchRegistrationResponse = await searchRegistrationByReferenceId(
      registrationWesterosCopy.referenceId,
      projectIdWesteros,
      accessToken,
    );
    const importedRegistration = searchRegistrationResponse.body.data[0];

    // Assert
    expect(responseImport.statusCode).toBe(HttpStatus.CREATED);
    expect(importedRegistration.paymentAmountMultiplier).toBe(nrOfDragons + 1);
  });

  it('should error if paymentAmountMultiplier is set while project has a formula', async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    // Arrange
    const registrationWesterosCopy = {
      ...registrationWesteros1,
      ...{ paymentAmountMultiplier: 3 },
    };

    // Act
    const responseImport = await importRegistrations(
      projectIdWesteros,
      [registrationWesterosCopy],
      accessToken,
    );

    const searchRegistrationResponse = await searchRegistrationByReferenceId(
      registrationWesterosCopy.referenceId,
      projectIdWesteros,
      accessToken,
    );
    // Assert
    expect(responseImport.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(searchRegistrationResponse.body).toMatchSnapshot();
  });

  it('should set paymentAmountMultiplier to 1 if project has no formula and paymentAmountMultiplier in import is not set', async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    // Arrange
    const registrationPvCopy = {
      ...registrationPV5,
    };

    // Act
    const responseImport = await importRegistrations(
      projectIdPV,
      [registrationPvCopy],
      accessToken,
    );

    const searchRegistrationResponse = await searchRegistrationByReferenceId(
      registrationPvCopy.referenceId,
      projectIdPV,
      accessToken,
    );
    const importedRegistration = searchRegistrationResponse.body.data[0];
    // Assert
    expect(responseImport.statusCode).toBe(HttpStatus.CREATED);
    expect(searchRegistrationResponse.body.data.length).toBe(1);
    expect(importedRegistration.paymentAmountMultiplier).toBe(1);
  });

  it('should set paymentAmountMultiplier based paymentAmountMultiplier if project has no formula', async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    // Arrange
    const paymentAmountMultiplier = 3;
    const registrationPvCopy = {
      ...registrationPV5,
      ...{ paymentAmountMultiplier },
    };
    // Act
    const responseImport = await importRegistrations(
      projectIdPV,
      [registrationPvCopy],
      accessToken,
    );

    const searchRegistrationResponse = await searchRegistrationByReferenceId(
      registrationPvCopy.referenceId,
      projectIdPV,
      accessToken,
    );
    const importedRegistration = searchRegistrationResponse.body.data[0];
    // Assert
    expect(responseImport.statusCode).toBe(HttpStatus.CREATED);
    expect(importedRegistration.paymentAmountMultiplier).toBe(
      paymentAmountMultiplier,
    );
  });
});
