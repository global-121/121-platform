import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import programTest from '@121-service/src/seed-data/program/program-test.json';

const updateSuccesfullNotification =
  englishTranslations.common['update-success'];
const programWesterosQuestionName =
  programTest.programRegistrationAttributes[1].label.en;

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
  readonly financialServiceProviderDropdown: Locator;

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
    this.financialServiceProviderDropdown = this.page.locator(
      'app-update-fsp #select-label',
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
    const fspAttribute = this.personAffectedInputForm.filter({
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
    alert = updateSuccesfullNotification,
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
    const alertMessage = this.page.getByRole('alertdialog');

    // Locate the field input which can be a textbox, textarea, number input, phone input, select, or checkbox
    const fieldInput = fieldSelector.locator(
      'ion-input input, textarea, input[type="number"], input[type="tel"], ion-select, ion-checkbox',
    );

    if (
      await fieldInput.evaluate(
        (el) => el.tagName.toLowerCase() === 'ion-select',
      )
    ) {
      await fieldInput.selectOption(newValue);
    } else if (
      await fieldInput.evaluate(
        (el) => el.tagName.toLowerCase() === 'ion-input',
      )
    ) {
      // Locate the native input element within ion-input
      const nativeInput = fieldInput.locator('input');
      await nativeInput.fill(newValue);
    } else {
      await fieldInput.fill(newValue);
    }

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
    alert = updateSuccesfullNotification,
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
    alert = updateSuccesfullNotification,
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
      hasText: programWesterosQuestionName,
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

  async updateHouseNumber({ numberString }: { numberString: string }) {
    const numericInput = this.personAffectedInputForm
      .getByRole('spinbutton')
      .first();
    const oldNumber = await numericInput.inputValue();

    await this.personAffectedHouseNumber.pressSequentially(numberString);
    await this.page.waitForLoadState('networkidle');
    const currentNumber = await numericInput.inputValue();
    expect(oldNumber).toBe(currentNumber);
  }

  async validateFspNamePresentInEditPopUp(fspName: string) {
    await this.page.waitForLoadState('networkidle');
    const fspLocator = this.financialServiceProviderDropdown.getByText(fspName);
    await fspLocator.scrollIntoViewIfNeeded();
    expect(await fspLocator.isVisible()).toBe(true);
  }

  async selectFspInputForm({ filterValue }: { filterValue: string }) {
    const fieldSelector = this.editPersonAffectedPopUp;
    const updatePropertyItem = fieldSelector.locator(
      'app-update-property-item',
    );
    const filteredItem = updatePropertyItem.filter({ hasText: filterValue });
    const inputForm = filteredItem.getByTestId(
      'update-property-item-input-form',
    );

    return inputForm.getByRole('textbox');
  }

  async updateAttributeByLabel({
    labelText,
    newValue,
  }: {
    labelText: string;
    newValue: string;
  }) {
    const saveButtonName = englishTranslations.common.save;
    const okButtonName = englishTranslations.common.ok;
    const labelElement = this.editPersonAffectedPopUp
      .locator(`text=${labelText}`)
      .first();
    const parentElement = labelElement.locator('..').locator('..');

    await this.updateField({
      fieldSelector: parentElement,
      newValue,
      saveButtonName,
      okButtonName,
      reasonText: (newValue) => `Change ${labelText} to ${newValue}`,
    });
  }

  async updatefinancialServiceProvider({
    fspNewName,
    fspOldName,
    saveButtonName,
    okButtonName,
    newAttributes,
  }: {
    fspNewName: string;
    fspOldName: string;
    saveButtonName: string;
    okButtonName: string;
    newAttributes: { labelText: string; newValue: string }[];
  }) {
    // Loop over the attributes and update each one
    for (const attribute of newAttributes) {
      await this.updateAttributeByLabel({
        labelText: attribute.labelText,
        newValue: attribute.newValue,
      });
    }

    const dropdown = this.page.getByRole('radio');
    const fieldSelector = this.personAffectedPopUpFsp;
    const okButton = this.page.getByRole('button', { name: okButtonName });

    await this.validateFspNamePresentInEditPopUp(fspOldName);
    await this.financialServiceProviderDropdown.click();
    await dropdown.getByText(fspNewName).click();

    await fieldSelector.getByText(saveButtonName).click();

    await okButton.waitFor({ state: 'visible' });
    await okButton.click();
  }
}

export default PersonalInformationPopup;
