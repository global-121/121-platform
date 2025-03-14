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
    await this.alertDialog.getByRole('button', { name: 'Save' }).click();

    // this re-appears after the save has been successful
    await expect(this.editInformationButton).toBeVisible();
  }
}

export default RegistrationPersonalInformationPage;
