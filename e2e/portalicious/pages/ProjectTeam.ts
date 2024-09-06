import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';
import BasePage from './BasePage';

class ProjectTeam extends BasePage {
  readonly page: Page;
  readonly tableRows: Locator;
  readonly usersDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.tableRows = this.page.locator('table tbody tr');
    this.usersDropdown = this.page.getByRole('option');
  }

  async validateAssignedTeamMembers(expectedAssignedUsers: string[]) {
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

  async navigateToAddTeamMemebers() {
    await this.page.getByRole('button', { name: 'Add team member' }).click();
  }

  async validateAvailableSystemUsers(expectedAssignedUsers: string[]) {
    await this.page.locator(`[formControlName="userValue"]`).click();
    const actualAssignedUsers = await this.usersDropdown.evaluateAll(
      (options) => options.map((option) => option.textContent.trim()),
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

export default ProjectTeam;
