import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';

import RegistrationBasePage from './RegistrationBasePage';

class RegistrationActivityLogPage extends RegistrationBasePage {
  readonly table: TableComponent;
  readonly personalInformationTab: Locator;
  readonly editInformationButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new TableComponent(page);
    this.personalInformationTab = this.page.getByRole('tab', {
      name: 'Personal Information',
    });
    this.editInformationButton = this.page.getByRole('button', {
      name: 'Edit information',
    });
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
  }

  async resetTableStateStorage() {
    await this.page.localStorage.removeItem('activity-log-table');
  }

  async validateLastMessageSent(message: string) {
    const lastMessageRow = this.table.tableRows
      .filter({
        has: this.page.getByText('Message', { exact: true }),
      })
      .first();

    await expect(lastMessageRow).toBeVisible();

    await expect(this.page.getByText(message)).not.toBeVisible();

    // The expanded state of this row is remembered in localStorage! So resetting the table-state is required for predictable test behavior.
    await lastMessageRow.getByLabel('Toggle row').click();

    await expect(this.page.getByText(message)).toBeVisible();
  }

  async navigateToPersonalInformation() {
    await this.personalInformationTab.click();
  }
}

export default RegistrationActivityLogPage;
