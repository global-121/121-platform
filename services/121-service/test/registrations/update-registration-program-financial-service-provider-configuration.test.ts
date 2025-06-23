import { HttpStatus } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
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
    const newProgramFspConfigurationName = 'Intersolve-voucher-whatsapp';
    const dataUpdate = {
      programFspConfigurationName: newProgramFspConfigurationName,
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
    expect(response.body.fspName).toBe(newProgramFspConfigurationName);
  });

  it('should fail when updating program financial servce provider configuration when a required property of new FSP is not yet present', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

    // Intersolve-voucher-whtatsapp does not have e.g. addressStreet which is required for Intersolve-visa
    const newProgramFspConfigurationName = 'Intersolve-visa';
    const dataUpdate = {
      programFspConfigurationName: newProgramFspConfigurationName,
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
    const newProgramFspConfigurationName = 'Intersolve-visa';
    const dataUpdate = {
      programFspConfigurationName: newProgramFspConfigurationName,
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
    expect(response.body.programFspConfigurationName).toBe(
      newProgramFspConfigurationName,
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
    const newProgramFspConfigurationName = 'Intersolve-voucher-whatsapp';
    const dataUpdate = {
      programFspConfigurationName: newProgramFspConfigurationName,
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

    const newProgramFspConfigurationName = 'VoucherNumberTwo';
    const newProgramFspConfigurationLabel = {
      en: 'Voucher number 2',
    };
    const fspConfigBody: CreateProgramFspConfigurationDto = {
      name: newProgramFspConfigurationName,
      fspName: Fsps.intersolveVoucherWhatsapp,
      label: newProgramFspConfigurationLabel,
      properties: [
        {
          name: FspConfigurationProperties.password,
          value: 'password',
        },
        {
          name: FspConfigurationProperties.username,
          value: 'username',
        },
      ],
    };
    await postProgramFspConfiguration({
      programId: programIdPv,
      body: fspConfigBody,
      accessToken,
    });

    const dataUpdate = {
      programFspConfigurationName: newProgramFspConfigurationName,
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
    expect(response.body.programFspConfigurationName).toBe(
      newProgramFspConfigurationName,
    );
    expect(transactionsResponse.text).toContain('success');
    expect(
      transactionsResponse.body[0].programFspConfigurationName,
    ).toStrictEqual(newProgramFspConfigurationName);
  });
});
