import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';

class ProjectTeam extends BasePage {
  readonly page: Page;
  readonly tableRows: Locator;
  readonly addUserFormUsersDropdown: Locator;
  readonly addUserFormChooseUserDropdown: Locator;
  readonly addUserFormChooseRoleDropdown: Locator;
  readonly addUserFormSubmitButton: Locator;
  readonly removeUserButton: Locator;
  readonly scopeColumn: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.tableRows = this.page.locator('table tbody tr');
    this.addUserFormUsersDropdown = this.page.getByRole('option');
    this.addUserFormChooseUserDropdown = this.page.locator(
      `[formControlName="userValue"]`,
    );
    this.addUserFormChooseRoleDropdown = this.page.locator(
      `[formControlName="rolesValue"]`,
    );
    this.addUserFormSubmitButton = this.page.getByRole('button', {
      name: 'Submit',
    });
    this.removeUserButton = this.page.getByRole('button', {
      name: 'Remove user',
    });
    this.scopeColumn = this.page.getByRole('columnheader', { name: 'Scope' });
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

  async openAddUserForm() {
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
    await this.addUserFormChooseUserDropdown.click();
    await this.addUserFormChooseUserDropdown.fill(userSearchPhrase);
    await this.page.getByText(userEmail).click();
    await this.addUserFormChooseRoleDropdown.click();
    await this.page.getByText(role).click();
    await this.addUserFormSubmitButton.click();
  }

  async validateAvailableSystemUsers(expectedAssignedUsers: string[]) {
    await this.addUserFormChooseUserDropdown.click();
    const actualAssignedUsers = await this.addUserFormUsersDropdown.evaluateAll(
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

  async validateScopeColumnIsVisible() {
    await expect(this.scopeColumn).toBeVisible();
  }

  async validateScopeColumnIsHidden() {
    await expect(this.scopeColumn).toBeHidden();
  }
}

export default ProjectTeam;
