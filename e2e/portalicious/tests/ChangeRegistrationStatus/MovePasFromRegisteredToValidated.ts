import test from '@playwright/test';

import { Components, Pages } from '../../../helpers/interfaces';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Validated" successfully. The status change can take up to a minute to process.';

export default (pages: Partial<Pages>, components: Partial<Components>) => {
  test('[31206] Move PA(s) from status "Registered" to "Validated"', async () => {
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

    await test.step('Change status of first selected registration to "Validated"', async () => {
      await tableComponent.changeStatusOfRegistrationInTable({
        status: 'Validate',
      });
      await basePage.validateToastMessage(toastMessage);
    });

    await test.step('Search for the registration with status "Validated"', async () => {
      await tableComponent.clearAllFilters();
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Validated',
      });
    });

    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Validated',
      });
    });
  });
};
