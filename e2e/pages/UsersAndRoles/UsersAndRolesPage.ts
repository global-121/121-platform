import { Locator } from '@playwright/test';
import { Page } from 'playwright';

class UsersAndRoles {
  readonly page: Page;
  readonly usersTabButton: Locator;
  readonly roleListTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usersTabButton = this.page.getByTestId('roles-tab-button');
    this.roleListTable = this.page.getByTestId('role-list-table');
  }

  async navigateRolesTab() {
    await this.usersTabButton.click();
  }
}

export default UsersAndRoles;
