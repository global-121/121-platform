import { Locator, Page } from 'playwright';

import BasePage from '../pages/BasePage';
import { PrimeNGDatePicker } from './PrimeNGDatePicker';

class CreateProgramDialog extends BasePage {
  readonly page: Page;
  readonly nextButton: Locator;
  readonly submitButton: Locator;
  readonly dateRangeStartInput: PrimeNGDatePicker;
  readonly dateRangeEndInput: PrimeNGDatePicker;
  readonly currencyDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.nextButton = this.page.getByRole('button', { name: 'Continue' });
    this.submitButton = this.page.getByRole('button', {
      name: 'Create program',
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
    defaultNrOfTransactions,
    fixedTransferValue,
    fsps,
  }: {
    fundsAvailable: string;
    currency: string;
    defaultNrOfTransactions: string;
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
      .fill(defaultNrOfTransactions);
    await this.page
      .getByLabel('*Fixed transfer value')
      .fill(fixedTransferValue);

    // Select the FSPs from the multiselect component
    await this.page.getByTestId('fsp-multiselect').click();
    for (const fsp of fsps) {
      await this.page.getByRole('option', { name: fsp }).click();
    }
    await this.closeOpenSelectOrMultiselectWithRetries();

    // Submit the form to create the program
    await this.submitButton.click();
  }
}

export default CreateProgramDialog;
