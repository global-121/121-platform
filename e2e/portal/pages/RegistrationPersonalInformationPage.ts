import { Locator, Page } from 'playwright';
import { expect } from 'playwright/test';

import DataListComponent from '../components/DataListComponent';
import RegistrationBasePage from './RegistrationBasePage';

class RegistrationPersonalInformationPage extends RegistrationBasePage {
  readonly editInformationButton: Locator;
  readonly editInformationReasonField: Locator;
  readonly saveButton: Locator;
  readonly registrationTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.editInformationButton = this.page.getByRole('button', {
      name: 'Edit information',
    });
    this.editInformationReasonField = this.page.getByLabel(
      'Write a reason for the update',
    );
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.registrationTitle = this.page.getByTestId('registration-title');
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
    dropdownLabel,
    option,
  }: {
    dropdownIdName: string;
    dropdownLabel: string;
    option: string;
  }) {
    const dropdown = this.page
      .getByTestId(`edit-personal-information-${dropdownIdName}`)
      .getByRole('button');
    await dropdown.click();
    await this.page.getByLabel(dropdownLabel).fill(option);
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

  async validateRegistrationTitle(registrationTitle: string) {
    const title = await this.registrationTitle.innerText();
    expect(title).toContain(registrationTitle);
  }

  async validatePersonalInformationField({
    fieldName,
    fieldValue,
  }: {
    fieldName: string;
    fieldValue: string;
  }) {
    const personalInformation = await this.personalInformationDataList();
    await expect(personalInformation[fieldName]).toBe(fieldValue);
  }

  async validateMultipleFieldsAtOnce({
    fieldName,
    fieldValue,
    expectedCount,
  }: {
    fieldName: string;
    fieldValue: string;
    expectedCount: number;
  }) {
    // This test helper will also assert against another data list component in
    // the page. So we can't use personalInformationDataList() here.
    // Probably better to make this explicit outside of this helper.
    const fields = this.page
      .locator('[data-testid-category="data-list-item"]')
      .filter({ hasText: fieldName })
      .locator('span');

    await expect(fields).toHaveCount(expectedCount);

    const count = await fields.count();

    for (let i = 0; i < count; i++) {
      await expect(fields.nth(i)).toHaveText(fieldValue, {
        useInnerText: true,
      });
    }
  }
}

export default RegistrationPersonalInformationPage;
