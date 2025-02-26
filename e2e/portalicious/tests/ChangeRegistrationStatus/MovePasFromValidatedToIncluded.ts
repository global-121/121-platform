import test from '@playwright/test';

import { Components, Pages } from '../../../helpers/interfaces';

const toastMessageValidated =
  'The status of 1 registration(s) is being changed to "Validated" successfully. The status change can take up to a minute to process.';
const toastMessageIncluded =
  'The status of 1 registration(s) is being changed to "Included" successfully. The status change can take up to a minute to process.';

export default (pages: Partial<Pages>, components: Partial<Components>) => {
  test('[31209] Move PA(s) from status "Validated" to "Included"', async () => {
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
      await basePage.validateToastMessage(toastMessageValidated);
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

    await test.step('Change status of first selected registration to "Validated"', async () => {
      await tableComponent.changeStatusOfRegistrationInTable({
        status: 'Include',
      });
      await basePage.validateToastMessage(toastMessageIncluded);
    });

    await test.step('Search for the registration with status "Validated"', async () => {
      await tableComponent.clearAllFilters();
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Included',
      });
    });

    await test.step('Reset all filters', async () => {
      await tableComponent.clearAllFilters();
    });
  });
};
