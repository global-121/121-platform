import { Locator, Page } from 'playwright';
import { expect } from 'playwright/test';

import DataListComponent from '../components/DataListComponent';
import RegistrationBasePage from './RegistrationBasePage';

class RegistrationPersonalInformationPage extends RegistrationBasePage {
  readonly editInformationButton: Locator;
  readonly editInformationReasonField: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.editInformationButton = this.page.getByRole('button', {
      name: 'Edit information',
    });
    this.editInformationReasonField = this.page.getByLabel(
      'Write a reason for the update',
    );
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
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
    await this.saveButton.click();
    await this.editInformationReasonField.fill(reason);
    await this.dialog.getByRole('button', { name: 'Save' }).click();

    // this re-appears after the save has been successful
    await expect(this.editInformationButton).toBeVisible();
  }

  personalInformationDataList(): Promise<Record<string, string>> {
    return new DataListComponent(
      this.page.locator('app-data-list').nth(1),
    ).getData();
  }

  async clickEditInformationButton() {
    await this.editInformationButton.click();
  }

  async saveChanges() {
    await this.saveButton.click();
    await this.page.getByLabel('Write a reason for the update').fill('Test');
    await this.saveButton.nth(1).click();
  }

  async selectDropdownOption({
    dropdownIdName,
    option,
  }: {
    dropdownIdName: string;
    option: string;
  }) {
    const dropwdown = this.page
      .getByTestId(`edit-personal-information-${dropdownIdName}`)
      .getByRole('button');
    await dropwdown.click();
    await this.page.getByLabel('Preferred Language').fill(option);
    await this.page.getByRole('option', { name: option }).click();
  }

  async fillTextInput({
    textInputIdName,
    textInputValue,
  }: {
    textInputIdName: string;
    textInputValue: string;
  }) {
    const textInput = this.page
      .getByTestId(`edit-personal-information-${textInputIdName}`)
      .getByRole('textbox');
    if (await textInput.isEnabled()) {
      await textInput.click();
      await textInput.fill(textInputValue);
    }
  }

  async fillNumberInput({
    numberInputIdName,
    numberInputValue,
  }: {
    numberInputIdName: string;
    numberInputValue: number;
  }) {
    const numberInput = this.page
      .getByTestId(`edit-personal-information-${numberInputIdName}`)
      .getByRole('spinbutton');
    if (await numberInput.isEditable()) {
      await numberInput.click();
      await numberInput.fill(String(numberInputValue));
    }
  }

  async validatePersonalInformationField({
    fieldName,
    fieldValue,
  }: {
    fieldName: string;
    fieldValue: string;
  }) {
    const field = this.page
      .locator('p')
      .filter({ hasText: new RegExp(`^${fieldName}:?\\s`) })
      .locator('span');
    const fieldText = (await field.innerText()).trim();
    expect(fieldText).toBe(fieldValue);
  }

  async validateMultiplePersonalInformationFields({
    fieldName,
    fieldValue,
    expectedCount,
  }: {
    fieldName: string;
    fieldValue: string;
    expectedCount: number;
  }) {
    const fields = this.page
      .locator('p')
      .filter({ hasText: fieldName })
      .locator('span');

    await expect(fields).toHaveCount(expectedCount);

    const count = await fields.count();
    for (let i = 0; i < count; i++) {
      const fieldText = (await fields.nth(i).innerText()).trim();
      expect(fieldText).toBe(fieldValue);
    }
  }
}

export default RegistrationPersonalInformationPage;
