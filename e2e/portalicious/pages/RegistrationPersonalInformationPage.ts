import { Locator, Page } from 'playwright';
import { expect } from 'playwright/test';

import RegistrationBasePage from './RegistrationBasePage';

class RegistrationPersonalInformationPage extends RegistrationBasePage {
  readonly editInformationButton: Locator;
  readonly editInformationReasonField: Locator;

  constructor(page: Page) {
    super(page);
    this.editInformationButton = this.page.getByRole('button', {
      name: 'Edit information',
    });
    this.editInformationReasonField = this.page.getByLabel(
      'Write a reason for the update',
    );
  }

  async editRegistration({
    field,
    value,
    reason = 'E2E test',
  }: {
    field: string;
    value: string;
    reason?: string;
  }) {
    await this.editInformationButton.click();
    await this.page.getByLabel(field).fill(value);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.editInformationReasonField.fill(reason);
    await this.dialog.getByRole('button', { name: 'Save' }).click();

    // this re-appears after the save has been successful
    await expect(this.editInformationButton).toBeVisible();
  }

  async personalInformationDataList(): Promise<Locator> {
    return this.page.locator('div.grid.grid-cols-1');
  }

  async getField(fieldName: string): Promise<Locator> {
    const personalInformationDataList =
      await this.personalInformationDataList();
    const field = personalInformationDataList.getByText(`${fieldName}:`, {
      exact: true,
    });
    return field;
  }

  async getFieldValue(fieldName: string): Promise<string> {
    let row: Locator;
    if (fieldName === 'Name') {
      // Name can occur multiple times on the page because of the full name naming convention
      row = this.page.locator(`p:has(strong:text-is("${fieldName}:"))`).first();
    } else {
      row = this.page.locator(`p:has(strong:text-is("${fieldName}:"))`);
    }
    await row.waitFor({ state: 'visible', timeout: 1000 });
    const fullText = (await row.textContent()) || '';
    return fullText.replace(`${fieldName}:`, '').trim();
  }
}

export default RegistrationPersonalInformationPage;
