import test from '@playwright/test';

import { Components, Pages } from '../../../helpers/interfaces';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Declined" successfully. The status change can take up to a minute to process.';

export default (pages: Partial<Pages>, components: Partial<Components>) => {
  test('[31208] Move PA(s) from status "Registered" to "Declined"', async () => {
    const { basePage, registrations } = pages;
    const { tableComponent } = components;

    if (!basePage || !registrations || !tableComponent) {
      throw new Error('pages and components not found');
    }

    await test.step('Apply filter on "Registration Status" column', async () => {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Registered',
      });
    });

    await test.step('Change status of first selected registration to "Declined"', async () => {
      await tableComponent.changeStatusOfRegistrationInTable({
        status: 'Decline',
      });
      await basePage.validateToastMessage(toastMessage);
    });

    await test.step('Search for the registration with status "Declined"', async () => {
      await tableComponent.clearAllFilters();
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
  });
};
