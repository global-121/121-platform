import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';
import { expectedSortedArraysToEqual } from '@121-e2e/portal/utils';

class ProgramTeamPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly addUserFormUsersDropdown: Locator;
  readonly addUserFormChooseUserDropdown: Locator;
  readonly addUserFormChooseRoleDropdown: Locator;
  readonly addUserFormSubmitButton: Locator;
  readonly removeUserButton: Locator;
  readonly scopeColumn: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.addUserFormUsersDropdown = this.page.getByRole('option');
    this.addUserFormChooseUserDropdown = this.page.locator(
      `[formControlName="userValue"]`,
    );
    this.addUserFormChooseRoleDropdown = this.page.locator(
      `[formControlName="rolesValue"]`,
    );
    this.addUserFormSubmitButton = this.page.getByRole('button', {
      name: 'Add to team',
    });
    this.removeUserButton = this.page.getByRole('button', {
      name: 'Remove user',
    });
    this.scopeColumn = this.page.getByRole('columnheader', { name: 'Scope' });
  }

  async validateAssignedTeamMembers(expectedAssignedUsers: string[]) {
    await this.table.waitForLoaded(expectedAssignedUsers.length);

    const actualAssignedUsers = await this.table.getTextArrayFromColumn(1);
    expectedSortedArraysToEqual(actualAssignedUsers, expectedAssignedUsers);
  }

  async enableEditMode() {
    await this.page.getByRole('button', { name: 'Edit team' }).click();
  }

  async openAddUserForm() {
    await this.page.getByRole('button', { name: 'Add user to team' }).click();
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
    await this.page.keyboard.press('Escape'); // Close the roles dropdown which stays open because multiple roles can be selected
    await this.addUserFormSubmitButton.click();
  }

  async validateAvailableSystemUsers(expectedAssignedUsers: string[]) {
    await this.addUserFormChooseUserDropdown.click();
    const actualAssignedUsers = await this.addUserFormUsersDropdown.evaluateAll(
      (options) => options.map((option) => option.textContent.trim()),
    );

    expectedSortedArraysToEqual(actualAssignedUsers, expectedAssignedUsers);
  }

  async removeUserFromTeam({ userEmail }: { userEmail: string }) {
    await this.page
      .getByRole('row', { name: userEmail })
      .getByRole('button')
      .click();
    await this.page.getByLabel('Remove user').click();
    await this.removeUserButton.click();
  }

  async editUser({ userEmail }: { userEmail: string }) {
    await this.page
      .getByRole('row', { name: userEmail })
      .getByRole('button')
      .click();
    await this.page.getByLabel('Edit').click();
  }

  async validateScopeColumnIsVisible() {
    await expect(this.scopeColumn).toBeVisible();
  }

  async validateScopeColumnIsHidden() {
    await expect(this.scopeColumn).toBeHidden();
  }
}

export default ProgramTeamPage;
