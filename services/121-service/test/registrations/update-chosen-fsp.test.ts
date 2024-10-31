import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationPvScoped } from '@121-service/test/registrations/pagination/pagination-data';

const programIdPv = 2;
const programIdOcw = 3;

async function setupNlrcEnvironment() {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();

  await importRegistrations(programIdOcw, [registrationVisa], accessToken);
  await importRegistrations(programIdPv, [registrationPvScoped], accessToken);

  return accessToken;
}

describe('Update chosen FSP of PA', () => {
  let accessToken: string;

  beforeEach(async () => {
    accessToken = await setupNlrcEnvironment();
  });

  it('should succeed when updating chosen FSP when all required properties of new FSP are already present', async () => {
    // Arrange
    await setupNlrcEnvironment();

    // Intersolve-visa and Intersolve-voucher-whatsapp both have 'whatsappPhoneNumber' as required
    const newProgramFinancialServiceProviderConfigurationName =
      'Intersolve-voucher-whatsapp';
    const dataUpdate = {
      programFinancialServiceProviderConfigurationName:
        newProgramFinancialServiceProviderConfigurationName,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdate,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.financialServiceProviderName).toBe(
      newProgramFinancialServiceProviderConfigurationName,
    );
  });

  it('should fail when updating chosen FSP when a required property of new FSP is not yet present', async () => {
    // Arrange
    await setupNlrcEnvironment();

    // Intersolve-voucher-whtatsapp does not have e.g. addressStreet which is required for Intersolve-visa
    const newProgramFinancialServiceProviderConfigurationName =
      'Intersolve-visa';
    const dataUpdate = {
      programFinancialServiceProviderConfigurationName:
        newProgramFinancialServiceProviderConfigurationName,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programIdPv,
      registrationPvScoped.referenceId,
      dataUpdate,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchSnapshot();
  });

  it('should succeed when updating chosen FSP when missing required properties of new FSP are passed along with the request', async () => {
    // Arrange
    await setupNlrcEnvironment();

    // Intersolve-voucher-whtatsapp does not have e.g. addressStreet which is required for Intersolve-visa
    // The missing attributes can be passed along (or can be updated first)
    const newProgramFinancialServiceProviderConfigurationName =
      'Intersolve-visa';
    const dataUpdate = {
      programFinancialServiceProviderConfigurationName:
        newProgramFinancialServiceProviderConfigurationName,
      addressStreet: 'Teststraat 1',
      addressHouseNumber: '1',
      addressCity: 'Teststad',
      addressPostalCode: '1234AB',
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programIdPv,
      registrationPvScoped.referenceId,
      dataUpdate,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.financialServiceProviderName).toBe(
      newProgramFinancialServiceProviderConfigurationName,
    );
  });
});
