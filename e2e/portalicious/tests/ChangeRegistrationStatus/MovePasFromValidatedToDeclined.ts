import test from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { changeBulkRegistrationStatus } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';

import { Components, Pages } from '../../../helpers/interfaces';

const toastMessageDeclined =
  'The status of 1 registration(s) is being changed to "Declined" successfully. The status change can take up to a minute to process.';

export default (pages: Partial<Pages>, components: Partial<Components>) => {
  test('[31210] Move PA(s) from status "Validated" to "Declined"', async () => {
    const accessToken = await getAccessToken();
    const { basePage, registrations } = pages;
    const { tableComponent } = components;

    if (!basePage || !registrations || !tableComponent) {
      throw new Error('pages and components not found');
    }

    await test.step('Change status of all registrations to "Validated"', async () => {
      await changeBulkRegistrationStatus({
        programId: 2,
        status: RegistrationStatusEnum.validated,
        accessToken,
      });
    });

    await test.step('Change status of first selected registration to "Declined"', async () => {
      await tableComponent.changeStatusOfRegistrationInTable({
        status: 'Decline',
      });
      await basePage.validateToastMessage(toastMessageDeclined);
    });

    await test.step('Search for the registration with status "Declined"', async () => {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Declined',
      });
    });

    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Declined',
      });
    });

    await test.step('Reset all filters', async () => {
      await tableComponent.clearAllFilters();
    });
  });
};
