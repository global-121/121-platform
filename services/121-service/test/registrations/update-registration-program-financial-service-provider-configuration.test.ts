import { HttpStatus } from '@nestjs/common';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { postProgramFinancialServiceProviderConfiguration } from '@121-service/test/helpers/program-financial-service-provider-configuration.helper';
import {
  importRegistrations,
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  removePermissionsFromRole,
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

describe('Update program financial servce provider configuration of PA', () => {
  let accessToken: string;

  it('should succeed when updating program financial servce provider configuration when all required properties of new FSP are already present', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

    // Intersolve-visa and Intersolve-voucher-whatsapp both have whatsappPhoneNumber as required
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

  it('should fail when updating program financial servce provider configuration when a required property of new FSP is not yet present', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

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

  it('should succeed when updating program financial servce provider configuration when missing required properties of new FSP are passed along with the request', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

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
    expect(response.body.programFinancialServiceProviderConfigurationName).toBe(
      newProgramFinancialServiceProviderConfigurationName,
    );
  });

  it('should fail when updating program financial servce provider configuration without right permission', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

    await removePermissionsFromRole(DefaultUserRole.Admin, [
      PermissionEnum.RegistrationFspConfigUPDATE,
    ]);
    accessToken = await getAccessToken();

    // Intersolve-visa and Intersolve-voucher-whatsapp both have 'whatsappPhoneNumber' as required, so this would succeed apart from the permission
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
    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('should succeed updating registration to a newly added FSP config of which the name is not the same as the FSP and doing a payment', async () => {
    // Arrange
    const payment = 1;
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await seedIncludedRegistrations(
      [registrationPvScoped],
      programIdPv,
      accessToken,
    );

    const newProgramFinancialServiceProviderConfigurationName =
      'VoucherNumberTwo';
    const newProgramFinancialServiceProviderConfigurationLabel = {
      en: 'Voucher number 2',
    };
    const fspConfigBody: CreateProgramFinancialServiceProviderConfigurationDto =
      {
        name: newProgramFinancialServiceProviderConfigurationName,
        financialServiceProviderName:
          FinancialServiceProviders.intersolveVoucherWhatsapp,
        label: newProgramFinancialServiceProviderConfigurationLabel,
        properties: [
          {
            name: FinancialServiceProviderConfigurationProperties.password,
            value: 'password',
          },
          {
            name: FinancialServiceProviderConfigurationProperties.username,
            value: 'username',
          },
        ],
      };
    await postProgramFinancialServiceProviderConfiguration({
      programId: programIdPv,
      body: fspConfigBody,
      accessToken,
    });

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
    await doPayment({
      programId: programIdPv,
      paymentNr: payment,
      amount: 15,
      referenceIds: [registrationPvScoped.referenceId],
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId: programIdPv,
      paymentReferenceIds: [registrationPvScoped.referenceId],
      accessToken,
      maxWaitTimeMs: 30_000,
    });

    const transactionsResponse = await getTransactions({
      programId: programIdPv,
      paymentNr: payment,
      registrationReferenceId: registrationPvScoped.referenceId,
      accessToken,
    });

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.programFinancialServiceProviderConfigurationName).toBe(
      newProgramFinancialServiceProviderConfigurationName,
    );
    expect(transactionsResponse.text).toContain('success');
    expect(
      transactionsResponse.body[0]
        .programFinancialServiceProviderConfigurationName,
    ).toStrictEqual(newProgramFinancialServiceProviderConfigurationName);
  });
});
