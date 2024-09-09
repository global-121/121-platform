import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';
import BasePage from './BasePage';

class ProjectTeam extends BasePage {
  readonly page: Page;
  readonly tableRows: Locator;
  readonly usersDropdown: Locator;
  readonly chooseUserDropdown: Locator;
  readonly chooseRoleDropdown: Locator;
  readonly submitButton: Locator;
  readonly removeUserButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.tableRows = this.page.locator('table tbody tr');
    this.usersDropdown = this.page.getByRole('option');
    this.chooseUserDropdown = this.page.locator(
      `[formControlName="userValue"]`,
    );
    this.chooseRoleDropdown = this.page.locator(
      `[formControlName="rolesValue"]`,
    );
    this.submitButton = this.page.getByRole('button', { name: 'Submit' });
    this.removeUserButton = this.page.getByRole('button', {
      name: 'Remove user',
    });
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

  async addUserToTeam({
    userSearchPhrase,
    userEmail,
    role,
  }: {
    userSearchPhrase: string;
    userEmail: string;
    role: string;
  }) {
    await this.chooseUserDropdown.click();
    await this.chooseUserDropdown.fill(userSearchPhrase);
    await this.page.getByText(userEmail).click();
    await this.chooseRoleDropdown.click();
    await this.page.getByText(role).click();
    await this.submitButton.click();
  }

  async validateAvailableSystemUsers(expectedAssignedUsers: string[]) {
    await this.chooseUserDropdown.click();
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

  async removeUserFromTeam({ userEmail }: { userEmail: string }) {
    await this.page
      .getByRole('row', { name: userEmail })
      .getByRole('button')
      .click();
    await this.page.getByLabel('Remove user').click();
    await this.removeUserButton.click();
  }
}

export default ProjectTeam;
