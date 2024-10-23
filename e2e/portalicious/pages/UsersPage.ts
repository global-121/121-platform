import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';

class UsersPage extends BasePage {
  page: Page;
  readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.tableRows = this.page.locator('table tbody tr');
  }

  async validateAssignedUsersNames(expectedAssignedUsers: string[]) {
    const actualAssignedUsers = await this.tableRows.evaluateAll((rows) =>
      rows.map((row) =>
        row.querySelector('td:nth-child(1)').textContent.trim(),
      ),
    );

    const sortedActualUsers = [...actualAssignedUsers].sort((a, b) =>
      a.localeCompare(b),
    );
    const sortedExpectedUsers = [...expectedAssignedUsers].sort((a, b) =>
      a.localeCompare(b),
    );

    expect(sortedActualUsers).toEqual(sortedExpectedUsers);
  }

  async validateAssignedUserEmails(expectedUserEmails: string[]) {
    const actualUserEmails = await this.tableRows.evaluateAll((rows) =>
      rows.map((row) =>
        row.querySelector('td:nth-child(2)').textContent.trim(),
      ),
    );

    const sortedActualUserEmails = [...actualUserEmails].sort((a, b) =>
      a.localeCompare(b),
    );
    const sortedExpectedUserEmails = [...expectedUserEmails].sort((a, b) =>
      a.localeCompare(b),
    );

    expect(sortedActualUserEmails).toEqual(sortedExpectedUserEmails);
  }

  async validateLastLogin(timestamp: string) {
    const lastLogin = await this.page
      .getByRole('row', {
        name: 'view-user view-user@example.',
      })
      .textContent();

    expect(lastLogin).toContain(timestamp);
  }
}

export default UsersPage;
