import test from '@playwright/test';

import { Pages } from '../../../helpers/interfaces';

export default (pages: Partial<Pages>) => {
  test('[31206] Move PA(s) from status "Registered" to "Validated"', async () => {
    const { basePage, registrations } = pages;

    if (!basePage || !registrations) {
      throw new Error('pages and components not found');
    }

    const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

    await test.step('Select program', async () => {
      await basePage.selectProgram(projectTitle);
    });

    await test.step('Apply filter and then clear all filters', async () => {
      // Get the first registration's full name from the table
      const registrationFullName =
        await registrations.getFirstRegistrationNameFromTable();

      // Apply global search filter by full name
      await registrations.table.globalSearch(registrationFullName);
    });
  });
};
