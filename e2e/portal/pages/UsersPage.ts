import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';
import { expectedSortedArraysToEqual } from '@121-e2e/portal/utils';

class UsersPage extends BasePage {
  page: Page;
  readonly table: TableComponent;
  readonly newUserButton: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly resetPasswordButton: Locator;
  readonly genericButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.newUserButton = this.page.getByRole('button', {
      name: 'Add new User',
    });
    this.fullNameInput = this.page
      .locator('label')
      .filter({ hasText: 'Full name' });
    this.emailInput = this.page.locator('label').filter({ hasText: 'E-mail' });
    this.submitButton = this.page.getByRole('button', { name: 'Add user' });
    this.resetPasswordButton = this.page
      .getByRole('button')
      .filter({ hasText: 'Reset password' });
    this.genericButton = this.page.getByRole('button');
  }

  async validateAssignedUsersNames(expectedAssignedUsers: string[]) {
    await this.table.waitForLoaded(expectedAssignedUsers.length);

    const actualAssignedUsers = await this.table.getTextArrayFromColumn(1);
    expectedSortedArraysToEqual(actualAssignedUsers, expectedAssignedUsers);
  }

  async validateAssignedUserEmails(expectedUserEmails: string[]) {
    await this.table.waitForLoaded(expectedUserEmails.length);

    const actualUserEmails = await this.table.getTextArrayFromColumn(2);
    expectedSortedArraysToEqual(actualUserEmails, expectedUserEmails);
  }

  async validateRowTextContent({
    email,
    textContent,
  }: {
    email: string;
    textContent: string;
  }) {
    const rowText = await this.page
      .getByRole('row', {
        name: email,
      })
      .textContent();
    if (rowText === null) {
      throw new Error(
        `Row with email ${email} not found or has no text content.`,
      );
    }
    const trimTextContent = rowText.trim();
    const formattedTextContent = trimTextContent.replace('  ', ' ');

    expect(formattedTextContent).toContain(textContent);
  }

  async addNewUser({ fullName, email }: { fullName: string; email: string }) {
    await this.newUserButton.click();
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async validateNewUserAdded({
    fullName,
    email,
  }: {
    fullName: string;
    email: string;
  }) {
    await this.validateToastMessage('User added');
    await this.validateRowTextContent({
      email,
      textContent: `${fullName} ${email}`,
    });
  }

  async selectUsersMenuItem({
    email,
    menuItem,
  }: {
    email: string;
    menuItem: string;
  }) {
    const selectUser = this.page.getByRole('row', {
      name: email,
    });
    await selectUser.getByRole('button').click();
    await this.page.getByRole('menuitem', { name: menuItem }).click();
  }

  async resetUsersPassword(email: string) {
    await this.selectUsersMenuItem({ email, menuItem: 'Reset password' });
    await this.resetPasswordButton.click();
  }
}

export default UsersPage;
