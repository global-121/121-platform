import { HttpStatus } from '@nestjs/common';
import { registrationVisa } from '../../seed-data/mock/visa-card.data';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { UpdateUserRoleDto } from '../../src/user/dto/user-role.dto';
import { PermissionEnum } from '../../src/user/enum/permission.enum';
import { DefaultUserRole } from '../../src/user/user-role.enum';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
  updateRegistration,
} from '../helpers/registration.helper';
import {
  getAccessToken,
  getRole,
  resetDB,
  updatePermissionsOfRole,
} from '../helpers/utility.helper';

const updatePhoneNumber = '15005550099';

describe('Update attribute of PA', () => {
  const programId = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationVisa], accessToken);
  });

  it('should not update unknown registration', async () => {
    // Arrange
    const wrongReferenceId = registrationVisa.referenceId + '-fail-test';
    const updatePhoneData = {
      phoneNumber: updatePhoneNumber,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programId,
      wrongReferenceId,
      updatePhoneData,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should succesfully update', async () => {
    // Arrange
    const reason = 'automated test';
    const dataUpdateSucces = {
      phoneNumber: updatePhoneNumber,
      firstName: 'Jane',
      maxPayments: 2,
      paymentAmountMultiplier: 3,
    };

    // Act
    const response = await updateRegistration(
      programId,
      registrationVisa.referenceId,
      dataUpdateSucces,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);

    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programId,
      accessToken,
    );
    const registration = result.body.data[0];
    expect(registration.phoneNumber).toBe(updatePhoneNumber);
    expect(registration.firstName).toBe(dataUpdateSucces.firstName);
    expect(registration.maxPayments).toBe(dataUpdateSucces.maxPayments);
    expect(registration.paymentAmountMultiplier).toBe(
      dataUpdateSucces.paymentAmountMultiplier,
    );
    // Is old data still the same?
    expect(registration.lastName).toBe(registrationVisa.lastName);
  });

  it('should fail on wrong phonenumber', async () => {
    // Arrange
    const updatePhoneNumber = '150';
    const dataUpdatePhoneFail = {
      firstName: 'Jane',
      phoneNumber: updatePhoneNumber,
    };

    const reason = 'automated test';
    // Act
    const response = await updateRegistration(
      programId,
      registrationVisa.referenceId,
      dataUpdatePhoneFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programId,
      accessToken,
    );
    const registration = result.body.data[0];

    // Is old data still the same?
    expect(registration.phoneNumber).toBe(registrationVisa.phoneNumber);
    expect(registration.firstName).toBe(registrationVisa.firstName);
    // Is old data still the same?
    expect(registration.lastName).toBe(registrationVisa.lastName);
  });

  it('should fail on duplicate referenceId', async () => {
    // Arrange
    const registrationVisa2 = {
      ...registrationVisa,
      referenceId: 'duplicate-reference-id',
    };
    await importRegistrations(programId, [registrationVisa2], accessToken);
    const dataUpdateReferenceIdFail = {
      firstName: 'Jane',
      referenceId: registrationVisa2.referenceId,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programId,
      registrationVisa.referenceId,
      dataUpdateReferenceIdFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    response.body;
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programId,
      accessToken,
    );
    const registration = result.body.data[0];

    expect(registration.phoneNumber).toBe(registrationVisa.phoneNumber);
    expect(registration.firstName).toBe(registrationVisa.firstName);
    expect(registration.paymentAmountMultiplier).toBe(
      registrationVisa.paymentAmountMultiplier,
    );

    // Is old data still the same?
    expect(registration.firstName).toBe(registrationVisa.firstName);
  });

  it('should fail on short referenceId', async () => {
    // Arrange
    const registrationVisa2 = {
      ...registrationVisa,
      referenceId: 'shor', //t
    };
    await importRegistrations(programId, [registrationVisa2], accessToken);
    const dataUpdateReferenceIdFail = {
      firstName: 'Jane',
      referenceId: registrationVisa2.referenceId,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programId,
      registrationVisa.referenceId,
      dataUpdateReferenceIdFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programId,
      accessToken,
    );
    const registration = result.body.data[0];

    // Is old data still the same?
    expect(registration.firstName).toBe(registrationVisa.firstName);
  });

  it('should fail on updating financial data without the right permission', async () => {
    // Arrange
    const dataUpdateFinanancialFail = {
      paymentAmountMultiplier: 5,
      referenceId: registrationVisa.referenceId,
    };
    const reason = 'automated test';

    const accessTokenNoFinancePermission = await getAccessToken(
      process.env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER,
      process.env.USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER,
    );

    // Act
    const response = await updateRegistration(
      programId,
      registrationVisa.referenceId,
      dataUpdateFinanancialFail,
      reason,
      accessTokenNoFinancePermission,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    response.body;
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programId,
      accessToken,
    );
    const registration = result.body.data[0];
    expect(registration.paymentAmountMultiplier).toBe(
      registrationVisa.paymentAmountMultiplier,
    );
  });

  it('should fail on updating  non financial data without the right permission', async () => {
    // Arrange
    const dataUpdateNonFinanancialFail = {
      phoneNumber: 5,
      referenceId: registrationVisa.referenceId,
    };
    const reason = 'automated test';

    const roleReponse = await getRole(DefaultUserRole.CvaManager);
    // Remove RegistrationAttributeUPDATE permission from roleReponse
    roleReponse.permissions = roleReponse.permissions.filter(
      (p) => p !== PermissionEnum.RegistrationAttributeUPDATE,
    );
    await updatePermissionsOfRole(
      roleReponse.id,
      roleReponse as UpdateUserRoleDto,
    );

    const accessTokenNoFinancePermission = await getAccessToken(
      process.env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER,
      process.env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_MANAGER,
    );

    // Act
    const response = await updateRegistration(
      programId,
      registrationVisa.referenceId,
      dataUpdateNonFinanancialFail,
      reason,
      accessTokenNoFinancePermission,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    response.body;
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programId,
      accessToken,
    );
    const registration = result.body.data[0];
    expect(registration.phoneNumber).toBe(registrationVisa.phoneNumber);
  });
});
