import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';

class UsersPage extends BasePage {
  page: Page;
  readonly tableRows: Locator;
  readonly newUserButton: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly resetPasswordButton: Locator;
  readonly genericButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.tableRows = this.page.locator('table tbody tr');
    this.newUserButton = this.page.getByRole('button', {
      name: 'Add new User',
    });
    this.fullNameInput = this.page
      .locator('label')
      .filter({ hasText: 'Full name' });
    this.emailInput = this.page.locator('label').filter({ hasText: 'E-mail' });
    this.submitButton = this.page.getByRole('button', { name: 'Submit' });
    this.resetPasswordButton = this.page
      .getByRole('button')
      .filter({ hasText: 'Reset password' });
    this.genericButton = this.page.getByRole('button');
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

  async validateRowTextContent({
    email,
    textContent,
  }: {
    email?: string;
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
    // Act
    await this.newUserButton.click();
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.submitButton.click();
    // Assert
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
    email?: string;
    menuItem: string;
  }) {
    const selectUser = this.page.getByRole('row', {
      name: email,
    });
    await selectUser.getByRole('button').click();
    await this.page.getByRole('menuitem', { name: menuItem }).click();
  }

  async resetUsersPassword(email?: string) {
    // Act
    await this.selectUsersMenuItem({ email, menuItem: 'Reset password' });
    await this.resetPasswordButton.click();
    // Assert
    await this.validateToastMessage('Password reset');
  }
}

export default UsersPage;
