import test from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  changeBulkRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
} from '@121-service/test/registrations/pagination/pagination-data';

import { Components, Pages } from '../../../helpers/interfaces';

export default (pages: Partial<Pages>, components: Partial<Components>) => {
  test('[31211] Move PA(s) from status "Included" to "Completed"', async () => {
    const accessToken = await getAccessToken();
    const paymentReferenceId = [registrationPvMaxPayment.referenceId];
    const { basePage, registrations } = pages;
    const { tableComponent } = components;

    if (!basePage || !registrations || !tableComponent) {
      throw new Error('pages and components not found');
    }

    await test.step('Upload extra registration with max payment set to 1', async () => {
      await importRegistrations(
        programIdPV,
        [registrationPvMaxPayment],
        accessToken,
      );
    });

    await test.step('Change status of all registrations to "Included"', async () => {
      await changeBulkRegistrationStatus({
        programId: 2,
        status: RegistrationStatusEnum.included,
        accessToken,
      });
    });

    await test.step('Search for the registration with status "Included"', async () => {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Included',
      });
    });

    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Included',
      });
    });

    await test.step('Change status of registratios to "Completed" with doing a payment', async () => {
      await doPayment({
        programId: 2,
        paymentNr: 1,
        amount: 100,
        referenceIds: paymentReferenceId,
        accessToken,
      });
    });

    await test.step('Search for the registration with status "Completed"', async () => {
      await tableComponent.clearAllFilters();
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Completed',
      });
    });

    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Completed',
      });
    });
  });
};
