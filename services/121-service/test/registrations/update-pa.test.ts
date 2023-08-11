import { HttpStatus } from '@nestjs/common';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  deleteRegistrations,
  getRegistration,
  importRegistrations,
  updatePa,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Update attribute of PA', () => {
  const programId = 3;
  const referenceId = 'referenceId-for-update-pa-test';
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '15005550098',
    fspName: FspName.intersolveVisa,
    whatsappPhoneNumber: '15005550098',
    addressStreet: 'Teststraat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: '',
    addressPostalCode: '1234AB',
    addressCity: 'Stad',
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registration], accessToken);
  });

  afterEach(async () => {
    await deleteRegistrations(
      programId,
      { referenceIds: [referenceId] },
      accessToken,
    );
  });

  it('should not update unknown registration', async () => {
    // Arrange
    const wrongReferenceId = referenceId + '-fail-test';
    const updatePhoneNumber = '15005550099';

    // Act
    const response = await updatePa(
      programId,
      wrongReferenceId,
      'phoneNumber',
      updatePhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should succesfully update', async () => {
    // Arrange
    const updatePhoneNumber = '15005550099';

    // Act
    const response = await updatePa(
      programId,
      referenceId,
      'phoneNumber',
      updatePhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const registration = await getRegistration(referenceId, accessToken);
    expect(registration.body.phoneNumber).toBe(updatePhoneNumber);
  });
});
