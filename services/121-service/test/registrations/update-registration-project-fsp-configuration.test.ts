import { HttpStatus } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import { postProjectFspConfiguration } from '@121-service/test/helpers/project-fsp-configuration.helper';
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

const projectIdPv = 2;
const projectIdOcw = 3;

async function setupNlrcEnvironment() {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();

  await importRegistrations(projectIdOcw, [registrationVisa], accessToken);
  await importRegistrations(projectIdPv, [registrationPvScoped], accessToken);

  return accessToken;
}

describe('Update project fsp configuration of PA', () => {
  let accessToken: string;

  it('should succeed when updating project fsp configuration when all required properties of new FSP are already present', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

    // Intersolve-visa and Intersolve-voucher-whatsapp both have whatsappPhoneNumber as required
    const newProjectFspConfigurationName = 'Intersolve-voucher-whatsapp';
    const dataUpdate = {
      projectFspConfigurationName: newProjectFspConfigurationName,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      projectIdOcw,
      registrationVisa.referenceId,
      dataUpdate,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.fspName).toBe(newProjectFspConfigurationName);
  });

  it('should fail when updating project fsp configuration when a required property of new FSP is not yet present', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

    // Intersolve-voucher-whtatsapp does not have e.g. addressStreet which is required for Intersolve-visa
    const newProjectFspConfigurationName = 'Intersolve-visa';
    const dataUpdate = {
      projectFspConfigurationName: newProjectFspConfigurationName,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      projectIdPv,
      registrationPvScoped.referenceId,
      dataUpdate,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchSnapshot();
  });

  it('should succeed when updating project fsp configuration when missing required properties of new FSP are passed along with the request', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

    // Intersolve-voucher-whtatsapp does not have e.g. addressStreet which is required for Intersolve-visa
    // The missing attributes can be passed along (or can be updated first)
    const newProjectFspConfigurationName = 'Intersolve-visa';
    const dataUpdate = {
      projectFspConfigurationName: newProjectFspConfigurationName,
      addressStreet: 'Teststraat 1',
      addressHouseNumber: '1',
      addressCity: 'Teststad',
      addressPostalCode: '1234AB',
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      projectIdPv,
      registrationPvScoped.referenceId,
      dataUpdate,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.projectFspConfigurationName).toBe(
      newProjectFspConfigurationName,
    );
  });

  it('should fail when updating project fsp configuration without right permission', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();

    await removePermissionsFromRole(DefaultUserRole.Admin, [
      PermissionEnum.RegistrationFspConfigUPDATE,
    ]);
    accessToken = await getAccessToken();

    // Intersolve-visa and Intersolve-voucher-whatsapp both have 'whatsappPhoneNumber' as required, so this would succeed apart from the permission
    const newProjectFspConfigurationName = 'Intersolve-voucher-whatsapp';
    const dataUpdate = {
      projectFspConfigurationName: newProjectFspConfigurationName,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      projectIdOcw,
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
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await seedIncludedRegistrations(
      [registrationPvScoped],
      projectIdPv,
      accessToken,
    );

    const newProjectFspConfigurationName = 'VoucherNumberTwo';
    const newProjectFspConfigurationLabel = {
      en: 'Voucher number 2',
    };
    const fspConfigBody: CreateProjectFspConfigurationDto = {
      name: newProjectFspConfigurationName,
      fspName: Fsps.intersolveVoucherWhatsapp,
      label: newProjectFspConfigurationLabel,
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
    await postProjectFspConfiguration({
      projectId: projectIdPv,
      body: fspConfigBody,
      accessToken,
    });

    const dataUpdate = {
      projectFspConfigurationName: newProjectFspConfigurationName,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      projectIdPv,
      registrationPvScoped.referenceId,
      dataUpdate,
      reason,
      accessToken,
    );
    await doPayment({
      projectId: projectIdPv,
      amount: 15,
      referenceIds: [registrationPvScoped.referenceId],
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdPv,
      paymentReferenceIds: [registrationPvScoped.referenceId],
      accessToken,
      maxWaitTimeMs: 30_000,
    });

    const transactionsResponse = await getTransactions({
      projectId: projectIdPv,
      paymentId: payment,
      registrationReferenceId: registrationPvScoped.referenceId,
      accessToken,
    });

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.projectFspConfigurationName).toBe(
      newProjectFspConfigurationName,
    );
    expect(transactionsResponse.text).toContain('success');
    expect(
      transactionsResponse.body[0].projectFspConfigurationName,
    ).toStrictEqual(newProjectFspConfigurationName);
  });
});
