import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';
import { expectedSortedArraysToEqual } from '@121-e2e/portal/utils';

const ACCESS_GROUP_LEVELS = [1, 2, 3, 4] as const;
const ACCESS_GROUP_LEVEL_PLACEHOLDER = 'Type or select';

export type AccessGroupLevel = (typeof ACCESS_GROUP_LEVELS)[number];
// The option label to select per level, or null to clear the level
export type AccessGroupLevelSelection = Partial<
  Record<AccessGroupLevel, null | string>
>;

class ProgramTeamPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly addUserFormUsersDropdown: Locator;
  readonly addUserFormChooseUserDropdown: Locator;
  readonly addUserFormChooseRoleDropdown: Locator;
  readonly addUserFormSubmitButton: Locator;
  readonly editUserFormSubmitButton: Locator;
  readonly removeUserButton: Locator;
  readonly scopeColumn: Locator;
  readonly accessGroupFormHeader: Locator;
  readonly ownAccessGroupsWarning: Locator;
  readonly openNewUserDialogButton: Locator;
  readonly closeDialogButton: Locator;
  readonly listbox: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.addUserFormUsersDropdown = this.page.getByRole('option');
    this.addUserFormChooseUserDropdown = this.page.locator(
      `[formControlname="userValue"]`,
    );
    this.addUserFormChooseRoleDropdown = this.page.locator(
      `[formControlname="rolesValue"]`,
    );
    this.addUserFormSubmitButton = this.page.getByRole('button', {
      name: 'Add to team',
    });
    this.editUserFormSubmitButton = this.page.getByRole('button', {
      name: 'Save changes',
    });
    this.removeUserButton = this.page.getByRole('button', {
      name: 'Remove user',
    });
    this.scopeColumn = this.page.getByRole('columnheader', { name: 'Scope' });
    this.accessGroupFormHeader = this.page.getByText('Access group', {
      exact: true,
    });
    this.ownAccessGroupsWarning = this.page.getByText(
      'Users cannot change their own access group levels',
    );
    this.openNewUserDialogButton = this.page.getByRole('button', {
      name: 'Add user to team',
    });
    this.closeDialogButton = this.page.getByRole('button', { name: 'Cancel' });
    this.listbox = this.page.getByRole('listbox');
  }

  async validateAssignedTeamMembers(expectedAssignedUsers: string[]) {
    await this.table.waitForLoaded(expectedAssignedUsers.length);

    const actualAssignedUsers = await this.table.getTextArrayFromColumn(1);
    expectedSortedArraysToEqual(actualAssignedUsers, expectedAssignedUsers);
  }

  async openAddUserForm() {
    await this.openNewUserDialogButton.click();
  }

  async addUserToTeam({
    userSearchPhrase,
    userEmail,
    role,
    accessGroupLevels,
  }: {
    userSearchPhrase: string;
    userEmail: string;
    role: string;
    accessGroupLevels?: AccessGroupLevelSelection;
  }) {
    await this.selectDropdownOption({
      locator: this.addUserFormChooseUserDropdown,
      option: userEmail,
      searchPhrase: userSearchPhrase,
    });
    await this.selectDropdownOption({
      locator: this.addUserFormChooseRoleDropdown,
      option: role,
    });
    if (accessGroupLevels) {
      await this.setAccessGroupLevels({ accessGroupLevels });
    }
    await this.addUserFormSubmitButton.click();
  }

  getAccessGroupLevelDropdown({ level }: { level: AccessGroupLevel }) {
    return this.page.locator(`[formControlName="accessGroup${level}Value"]`);
  }

  async setAccessGroupLevels({
    accessGroupLevels,
  }: {
    accessGroupLevels: AccessGroupLevelSelection;
  }) {
    for (const [level, option] of Object.entries(accessGroupLevels)) {
      const dropdown = this.getAccessGroupLevelDropdown({
        level: Number(level) as AccessGroupLevel,
      });
      if (option === null) {
        await dropdown.locator('.p-select-clear-icon').click();
        continue;
      }
      await this.selectDropdownOption({ locator: dropdown, option });
    }
  }

  async saveEditedUser() {
    await this.editUserFormSubmitButton.click();
  }

  async validateAccessGroupLevels({
    accessGroupLevels,
  }: {
    accessGroupLevels: AccessGroupLevelSelection;
  }) {
    for (const [level, option] of Object.entries(accessGroupLevels)) {
      const selectedValue = this.getAccessGroupLevelDropdown({
        level: Number(level) as AccessGroupLevel,
      }).getByRole('combobox');
      await expect(selectedValue).toHaveText(
        option ?? ACCESS_GROUP_LEVEL_PLACEHOLDER,
      );
    }
  }

  async validateAccessGroupLevelsAreDisabled() {
    for (const level of ACCESS_GROUP_LEVELS) {
      const dropdown = this.getAccessGroupLevelDropdown({ level });
      if (!(await dropdown.isVisible())) {
        continue;
      }
      await expect(dropdown.getByRole('combobox')).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
  }

  async validateAccessGroupFormIsVisible() {
    await expect(this.accessGroupFormHeader).toBeVisible();
    await expect(this.getAccessGroupLevelDropdown({ level: 1 })).toBeVisible();
  }

  async validateAccessGroupFormIsHidden() {
    await expect(this.accessGroupFormHeader).toBeHidden();
    for (const level of ACCESS_GROUP_LEVELS) {
      await expect(this.getAccessGroupLevelDropdown({ level })).toBeHidden();
    }
  }

  async closeDialog() {
    await this.closeDialogButton.click();
  }

  async validateAvailableSystemUsers(expectedAssignedUsers: string[]) {
    await this.addUserFormChooseUserDropdown.click();
    await expect(this.listbox).toBeVisible();
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
      .first()
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
