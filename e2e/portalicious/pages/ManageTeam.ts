import { expect } from '@playwright/test';
import { Page } from 'playwright';
import BasePage from './BasePage';

class ManageTeam extends BasePage {
  page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  async validateAssignedTeamMembers(expectedAssignedUsers: string[]) {
    const userRows = this.page.locator('table tbody tr');
    const actualAssignedUsers = await userRows.evaluateAll((rows) =>
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
}

export default ManageTeam;
