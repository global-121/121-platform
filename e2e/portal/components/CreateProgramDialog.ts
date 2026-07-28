import { Locator, Page } from 'playwright';

import BasePage from '../pages/BasePage';
import { PrimeNGDatePicker } from './PrimeNGDatePicker';
class CreateProgramDialog extends BasePage {
  readonly nextButton: Locator;
  readonly submitButton: Locator;
  readonly duplicateProgramSubmitButton: Locator;
  readonly dateRangeStartInput: PrimeNGDatePicker;
  readonly dateRangeEndInput: PrimeNGDatePicker;
  readonly currencyDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.nextButton = this.page.getByRole('button', { name: 'Continue' });
    this.submitButton = this.page.getByRole('button', {
      name: 'Create program',
    });
    this.duplicateProgramSubmitButton = this.page.getByRole('button', {
      name: 'Duplicate program',
    });
    this.dateRangeStartInput = new PrimeNGDatePicker({
      page: this.page,
      datePicker: this.page.getByLabel('Start date'),
    });
    this.dateRangeEndInput = new PrimeNGDatePicker({
      page: this.page,
      datePicker: this.page.getByLabel('End date'),
    });
    this.currencyDropdown = this.page.locator(`[formControlName="currency"]`);
  }

  async createDuplicateProgramWithNewName({ name }: { name: string }) {
    await this.page.getByText('Step 1 of 3').waitFor();
    await this.page.getByLabel('*Program name').fill(name);
    await this.nextButton.click();
    await this.page.getByText('Step 2 of 3').waitFor();
    await this.nextButton.click();
    await this.page.getByText('Step 3 of 3').waitFor();
    await this.duplicateProgramSubmitButton.click();
  }

  async fillInStep1({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) {
    await this.page.getByLabel('*Program name').fill(name);
    await this.page.getByLabel('Program description').fill(description);
    await this.nextButton.click();
  }

  async fillInStep2({
    dateRange: { start, end },
    location,
    targetRegistrations,
  }: {
    dateRange: { start: Date; end: Date };
    location: string;
    targetRegistrations: string;
  }) {
    await this.page.getByLabel('Location').fill(location);
    await this.page
      .getByLabel('*Target registrations')
      .fill(targetRegistrations);
    await this.dateRangeStartInput.selectDate({ targetDate: start });
    await this.dateRangeEndInput.selectDate({ targetDate: end });
    await this.nextButton.click();
  }

  async fillInStep3({
    fundsAvailable,
    currency,
    defaultNumberOfTransactions,
    fixedTransferValue,
    fsps,
  }: {
    fundsAvailable: string;
    currency: string;
    defaultNumberOfTransactions: string;
    fixedTransferValue: string;
    fsps: string[];
  }) {
    await this.page.getByLabel('Funds available').fill(fundsAvailable);
    await this.currencyDropdown.click();
    await this.page
      .getByRole('option', { name: currency, exact: true })
      .click();
    await this.page
      .getByLabel('Default transactions per registration')
      .fill(defaultNumberOfTransactions);
    await this.page
      .getByLabel('*Fixed transfer value')
      .fill(fixedTransferValue);

    if (fsps && fsps.length > 0) {
      await this.selectMultiselectOptions({
        dropdownTestId: 'fsp-multiselect',
        optionsToClick: fsps,
      });
    }

    // Submit the form to create the program
    await this.submitButton.click();
  }
}

export default CreateProgramDialog;
