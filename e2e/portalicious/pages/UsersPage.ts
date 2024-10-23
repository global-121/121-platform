import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';

class UsersPage extends BasePage {
  page: Page;
  readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.tableRows = this.page.locator('table tbody tr');
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
    await this.page.getByRole('button', { name: 'Add new User' }).click();
    await this.page
      .locator('label')
      .filter({ hasText: 'Full name' })
      .fill(fullName);
    await this.page.locator('label').filter({ hasText: 'E-mail' }).fill(email);
    await this.page.getByRole('button', { name: 'Submit' }).click();
    await this.validateToastMessage('User added');
    await this.validateRowTextContent({
      email,
      textContent: `${fullName} ${email}`,
    });
  }
}

export default UsersPage;
