import programTestTranslations from '@121-service/src/seed-data/program/program-test.json';
import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';
import englishTranslations from '../../../interfaces/Portal/src/assets/i18n/en.json';

class PersonalInformationPopup {
  readonly page: Page;
  readonly editPersonAffectedPopUp: Locator;
  readonly tileInformationPlaceHolder: Locator;
  readonly updateReasonTextArea: Locator;
  readonly personAffectedEditPopUpTitle: Locator;
  readonly personAffectedPopUpFsp: Locator;
  readonly personAffectedPhoneNumber: Locator;
  readonly personAffectedPaymentMultiplier: Locator;
  readonly personAffectedLanguage: Locator;
  readonly personAffectedPopUpSaveButton: Locator;
  readonly personAffectedHouseNumber: Locator;
  readonly personAffectedInputForm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editPersonAffectedPopUp = this.page.locator(
      'app-edit-person-affected-popup',
    );
    this.tileInformationPlaceHolder = this.page.getByTestId(
      'registration-activity-detail-change',
    );
    this.updateReasonTextArea = this.page.getByTestId(
      'user-data-update-textarea',
    );
    this.personAffectedEditPopUpTitle = this.page.getByTestId(
      'edit-person-affected-popup-title',
    );
    this.personAffectedPopUpFsp = this.page.getByTestId(
      'edit-person-affected-popup-fsp-dropdown',
    );
    this.personAffectedPhoneNumber = this.page.getByTestId(
      'edit-person-affected-popup-phone-number',
    );
    this.personAffectedPaymentMultiplier = this.page.getByTestId(
      'edit-person-affected-popup-payment-multiplier',
    );
    this.personAffectedLanguage = this.page.getByTestId(
      'preferred-language-dropdown',
    );
    this.personAffectedPopUpSaveButton = this.page.getByTestId(
      'confirm-prompt-button-default',
    );
    this.personAffectedHouseNumber = this.page.getByTestId(
      'update-property-item-numeric-input',
    );
    this.personAffectedInputForm = this.page.getByTestId(
      'update-property-item-input-form',
    );
  }

  async validatePiiPopUp({
    paId,
    whatsappLabel,
    saveButtonName,
  }: {
    paId: string;
    whatsappLabel: string;
    saveButtonName: string;
  }) {
    const fspAttribute = await this.personAffectedInputForm.filter({
      hasText: whatsappLabel,
    });
    const saveButton = this.personAffectedPopUpSaveButton.filter({
      hasText: saveButtonName,
    });
    expect(await this.personAffectedEditPopUpTitle.textContent()).toContain(
      paId,
    );
    await expect(this.personAffectedPaymentMultiplier).toBeVisible();
    await expect(this.personAffectedLanguage).toBeVisible();
    await expect(this.personAffectedPhoneNumber).toBeVisible();
    await expect(this.personAffectedPopUpFsp).toBeVisible();
    expect(await fspAttribute.textContent()).toContain(whatsappLabel);

    for (let i = 0; i < (await saveButton.count()); i++) {
      await expect(saveButton.nth(i)).toHaveAttribute('aria-disabled', 'true');
    }
  }

  async updateField({
    fieldSelector,
    newValue,
    saveButtonName,
    okButtonName,
    alert = englishTranslations.common['update-success'],
    reasonText,
  }: {
    fieldSelector: Locator;
    newValue: string;
    saveButtonName: string;
    okButtonName: string;
    alert?: string;
    reasonText: (newValue: string) => string;
  }) {
    const saveButton = this.page.getByRole('button', { name: saveButtonName });
    const okButton = this.page.getByRole('button', { name: okButtonName });
    // const alertMessage = this.page.locator('div.alert-message');
    const alertMessage = this.page.getByRole('alertdialog');
    const fieldInput = fieldSelector.getByRole('textbox');
    await fieldInput.fill(newValue);

    await this.page.waitForLoadState('networkidle');
    await fieldSelector.getByText(saveButtonName).click();

    await this.updateReasonTextArea
      .locator('textarea')
      .fill(reasonText(newValue));

    await saveButton.waitFor({ state: 'visible' });
    await saveButton.click();

    await alertMessage.waitFor({ state: 'visible' });
    expect((await alertMessage.allTextContents())[0]).toContain(alert);

    await okButton.waitFor({ state: 'visible' });
    await okButton.click();
  }

  async updatepaymentAmountMultiplier({
    amount = 'default',
    saveButtonName,
    okButtonName,
    alert = englishTranslations.common['update-success'],
  }: {
    amount?: string;
    saveButtonName: string;
    okButtonName: string;
    alert?: string;
  }): Promise<string> {
    const fieldSelector = this.personAffectedPaymentMultiplier; // Update with correct selector
    const oldAmount = await this.personAffectedPaymentMultiplier
      .getByRole('textbox')
      .inputValue();

    if (amount === 'default') {
      amount = (parseInt(oldAmount, 10) + 1).toString();
    }

    await this.updateField({
      fieldSelector,
      newValue: amount,
      saveButtonName,
      okButtonName,
      alert,
      reasonText: (newValue) => `Change multiplier to ${newValue}`,
    });

    return oldAmount;
  }

  async validateAmountMultiplier({ amount }: { amount: string }) {
    const paymentMultipierInput =
      this.personAffectedPaymentMultiplier.getByRole('textbox');
    expect(await paymentMultipierInput.inputValue()).toBe(amount);
  }

  async updatehousenumber({ numberString }: { numberString: string }) {
    const numericInput = this.personAffectedHouseNumber.getByRole('spinbutton');
    const oldNumber = await numericInput.inputValue();
    const currentNumber = await numericInput.inputValue();

    await this.personAffectedHouseNumber.pressSequentially(numberString);
    await this.page.waitForLoadState('networkidle');
    expect(oldNumber).toBe(currentNumber);
  }

  async updatePhoneNumber({
    phoneNumber,
    saveButtonName,
    okButtonName,
    alert = englishTranslations.common['update-success'],
  }: {
    phoneNumber: string;
    saveButtonName: string;
    okButtonName: string;
    alert?: string;
  }) {
    const fieldSelector = this.personAffectedPhoneNumber;

    await this.updateField({
      fieldSelector,
      newValue: phoneNumber,
      saveButtonName,
      okButtonName,
      alert,
      reasonText: (newValue) => `Change phoneNumber to ${newValue}`,
    });
  }

  async typeStringInDateInputForm({
    saveButtonName,
  }: {
    saveButtonName: string;
  }) {
    const birthDateForm = this.personAffectedInputForm.filter({
      hasText: programTestTranslations.programQuestions[1].label.en,
    });
    const birthDateInput = birthDateForm.getByRole('textbox');
    const formSaveButton = birthDateForm.getByRole('button', {
      name: saveButtonName,
    });
    const saveButton = this.page.getByRole('button', {
      name: saveButtonName,
    });

    await birthDateInput.fill('string');

    await formSaveButton.waitFor({ state: 'visible' });
    await formSaveButton.click({ force: true });
    await this.updateReasonTextArea
      .locator('textarea')
      .fill(`Test reason:  Type a string in a date input`);
    await saveButton.click();
  }
}

export default PersonalInformationPopup;
